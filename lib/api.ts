const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export type ApiRequestOptions = {
  method?: string;
  body?: any;
  headers?: HeadersInit;
  /**
   * Whether to attach Authorization header and perform auto-refresh on 401.
   * Defaults to true.
   */
  auth?: boolean;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(params: { accessToken: string; refreshToken?: string }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, params.accessToken);
  if (params.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    const newAccessToken: string | undefined = data.accessToken;
    const newRefreshToken: string | undefined = data.refreshToken;

    if (!newAccessToken) {
      clearTokens();
      return null;
    }

    setTokens({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken ?? refreshToken,
    });

    return newAccessToken;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to refresh access token", error);
    clearTokens();
    return null;
  }
}

export async function apiFetch<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const { method = "GET", body, headers, auth = true } = options;

  const finalHeaders: HeadersInit = {
    ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };

  let accessToken: string | null = null;

  if (auth && typeof window !== "undefined") {
    accessToken = getAccessToken();
    if (accessToken) {
      (finalHeaders as any).Authorization = `Bearer ${accessToken}`;
    }
  }

  const fetchOptions: RequestInit = {
    method,
    headers: finalHeaders,
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  };

  let response = await fetch(url, fetchOptions);

  // Attempt a single refresh + retry on 401 when auth is enabled
  if (auth && response.status === 401 && typeof window !== "undefined") {
    const newToken = await refreshAccessToken();
    if (newToken) {
      (finalHeaders as any).Authorization = `Bearer ${newToken}`;
      response = await fetch(url, fetchOptions);
    }
  }

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      // ignore JSON parse errors
    }

    const message =
      errorBody?.message ||
      errorBody?.error ||
      `Request to ${path} failed with status ${response.status}`;

    const error: any = new Error(message);
    error.status = response.status;
    error.body = errorBody;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json();
  return data as T;
}

export async function loginWithEmailPassword(email: string, password: string) {
  const result = await apiFetch<{
    user: any;
    accessToken: string;
    refreshToken: string;
  }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });

  setTokens({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  return result;
}

