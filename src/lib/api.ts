export type Role = "CUSTOMER" | "WORKER" | "ADMIN";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  roles: Role[];
  activeRole: Role;
}

export interface Session {
  user: User;
  accessToken: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

const BASE_URL = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`;

/** Held in memory only, so a script on the page cannot read it from storage. */
let accessToken: string | null = null;
let refreshInFlight: Promise<Session> | null = null;
let onSessionExpired: () => void = () => {};

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

async function send<T>(path: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.code ?? "ERROR", data.message ?? "Request failed", data.retryAfter);
  }
  return data as T;
}

/**
 * Exchanges the refresh cookie for a new access token. Each refresh token works once, so
 * concurrent calls in this tab share a request, and the lock queues other tabs behind it.
 * They then read the newer cookie rather than replaying the old one.
 */
export function refreshSession(): Promise<Session> {
  refreshInFlight ??= withCrossTabLock(() => send<Session>("/auth/refresh", "POST", {}))
    .then((session) => {
      accessToken = session.accessToken;
      return session;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  return navigator.locks ? (navigator.locks.request("indege-refresh", task) as Promise<T>) : task();
}

/** Makes an API call, renewing an expired access token once before giving up. */
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  try {
    return await send<T>(path, method, body);
  } catch (error) {
    const expired = error instanceof ApiError && error.status === 401 && accessToken !== null;
    if (!expired) throw error;
  }

  try {
    await refreshSession();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      accessToken = null;
      onSessionExpired();
    }
    throw error;
  }
  return send<T>(path, method, body);
}
