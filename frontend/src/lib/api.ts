import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { queryClient } from "./query-client";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const REFRESH_URL = `${API_BASE}/refresh`;

// Flask-JWT-Extended double-submit CSRF: the backend mints non-httpOnly cookies
// holding the CSRF token, which we must echo back in the X-CSRF-TOKEN header on
// every state-changing request. Access-token-protected routes use
// csrf_access_token; the refresh route (jwt_required(refresh=True)) uses
// csrf_refresh_token.
const CSRF_ACCESS_COOKIE = "csrf_access_token";
const CSRF_REFRESH_COOKIE = "csrf_refresh_token";
const CSRF_HEADER = "X-CSRF-TOKEN";
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

function isRefreshUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url === REFRESH_URL || url.endsWith("/refresh");
}

// Unauthenticated route paths (see AuthenticationBase group in App.tsx). When
// a refresh fails we redirect to /login, but never if we're already on one of
// these — that would cause a redirect loop.
const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/create_account",
  "/request_password_reset",
  "/reset_password",
  "/activation_email_sent",
  "/pick_username",
  "/password_reset_link_sent",
  "/verify_email",
  "/email_verification_successful",
  "/email_already_verified",
  "/email_verification_unsuccessful",
  "/email_verification_form",
  "/verify_password_reset_token",
  "/password_reset_link_invalid",
];

function isOnAuthRoute(): boolean {
  const path = window.location.pathname;
  return AUTH_ROUTE_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

// Fires once per failure burst: a refresh failure means the session is dead,
// so purge all cached private data, flip AuthContext to logged-out, and
// redirect to /login. Guarded so concurrent 401s don't clear/redirect twice.
let loggingOut = false;

// Re-arm the logout guard after a successful (re)authentication. Without this,
// the first 401 of a page session latches loggingOut=true forever, so a later
// genuine session expiry would find forceLogout() a no-op. Called on login
// success and after a successful token refresh.
export function markAuthenticated(): void {
  loggingOut = false;
}

function forceLogout(): void {
  if (loggingOut) return;
  loggingOut = true;

  // Purge all cached private data, then explicitly mark the auth query as
  // logged-out so AuthContext flips immediately without awaiting a refetch.
  queryClient.clear();
  queryClient.setQueryData(["auth", "me"], null);

  if (!isOnAuthRoute()) {
    window.location.assign("/login");
  }
}

// Paths that must never trigger a refresh-then-retry on 401 — either they
// ARE the refresh flow, or a 401 from them legitimately means "bad creds"
// rather than "expired token."
const NO_REFRESH_PATHS = ["/refresh", "/login", "/create_account"];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REFRESH_PATHS.some((p) => url.includes(p));
}

// Dedupe concurrent refreshes: if N requests 401 in parallel, we only POST
// to /refresh once and every caller awaits the same promise.
let refreshPromise: Promise<void> | null = null;

function refreshTokens(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(REFRESH_URL, null, { withCredentials: true })
      .then(() => {
        // Session is alive again — re-arm the logout guard.
        markAuthenticated();
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Attach the CSRF token to every mutating axios request. The /refresh call is
// protected by the refresh token, so it needs csrf_refresh_token; everything
// else uses csrf_access_token. Reading the cookie lazily here means the retry
// (axios(original) below) re-runs this interceptor and picks up the rotated
// token after a refresh.
axios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "get").toLowerCase();
  if (!MUTATING_METHODS.has(method)) return config;

  const token = getCookie(
    isRefreshUrl(config.url) ? CSRF_REFRESH_COOKIE : CSRF_ACCESS_COOKIE,
  );
  if (token) config.headers.set(CSRF_HEADER, token);

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      !original ||
      error.response?.status !== 401 ||
      original._retried ||
      shouldSkipRefresh(original.url)
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      await refreshTokens();
    } catch {
      forceLogout();
      return Promise.reject(error);
    }

    return axios(original);
  },
);

// Drop-in replacement for `fetch` that transparently refreshes the access
// token on 401 and retries once. Components currently using raw `fetch` can
// migrate to this without changing their signatures.
export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toLowerCase();
  const isMutating = MUTATING_METHODS.has(method);

  // Rebuilt per attempt so the post-refresh retry picks up the rotated
  // csrf_access_token cookie. All callers hit access-token-protected routes.
  const buildInit = (): RequestInit => {
    const headers = new Headers(init.headers);
    if (isMutating) {
      const token = getCookie(CSRF_ACCESS_COOKIE);
      if (token) headers.set(CSRF_HEADER, token);
    }
    return { credentials: "include", ...init, headers };
  };

  const response = await fetch(input, buildInit());

  if (response.status !== 401) return response;

  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  if (shouldSkipRefresh(url)) return response;

  try {
    await refreshTokens();
  } catch {
    forceLogout();
    return response;
  }

  return fetch(input, buildInit());
}
