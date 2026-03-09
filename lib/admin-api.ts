/**
 * Admin API client – all requests go to the Express backend (NEXT_PUBLIC_API_URL).
 * Uses apiFetch with auth so the backend receives the Bearer token.
 */

import { apiFetch } from "./api";

export type AdminApiOptions = RequestInit & {
  auth?: boolean;
  body?: unknown;
};

export function adminApi<T = unknown>(path: string, options: AdminApiOptions = {}): Promise<T> {
  const { auth = true, body, ...rest } = options;
  const method = options.method ?? "GET";
  return apiFetch<T>(`/api/admin${path}`, {
    ...rest,
    method,
    auth,
    ...(body !== undefined && { body }),
  });
}

export default adminApi;
