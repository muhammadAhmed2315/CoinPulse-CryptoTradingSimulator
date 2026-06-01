import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { queryClient } from "./query-client";

const API_BASE = "http://localhost:5000";
const REFRESH_URL = `${API_BASE}/refresh`;

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
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

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
  const merged: RequestInit = { credentials: "include", ...init };
  const response = await fetch(input, merged);

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

  return fetch(input, merged);
}
