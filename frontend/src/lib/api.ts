import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:5000";
const REFRESH_URL = `${API_BASE}/refresh`;

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
    return response;
  }

  return fetch(input, merged);
}
