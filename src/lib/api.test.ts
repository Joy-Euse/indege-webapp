import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, refreshSession, setAccessToken, setSessionExpiredHandler } from "./api";

const user = { id: "1", fullName: "Aline", phone: "+250788123456", roles: ["CUSTOMER"], activeRole: "CUSTOMER" };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

const fetchMock = vi.fn<typeof fetch>();

function callsTo(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("navigator", {});
  setAccessToken(null);
  setSessionExpiredHandler(() => {});
});

describe("api", () => {
  it("sends the access token and cookies", async () => {
    setAccessToken("abc");
    fetchMock.mockResolvedValue(json(200, { ok: true }));

    await api("/auth/me");

    const init = fetchMock.mock.calls[0][1]!;
    expect(init.credentials).toBe("include");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc");
  });

  it("turns error responses into ApiError with the server's code", async () => {
    fetchMock.mockResolvedValue(json(429, { code: "OTP_COOLDOWN", message: "wait", retryAfter: 42 }));

    const error = await api("/auth/register", "POST", {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: "OTP_COOLDOWN", retryAfter: 42 });
  });

  it("renews an expired token once and retries with the new one", async () => {
    setAccessToken("old");
    fetchMock
      .mockResolvedValueOnce(json(401, { code: "UNAUTHORIZED" }))
      .mockResolvedValueOnce(json(200, { user, accessToken: "new" }))
      .mockResolvedValueOnce(json(200, { user }));

    await expect(api("/auth/me")).resolves.toEqual({ user });

    const retry = fetchMock.mock.calls[2][1]!;
    expect((retry.headers as Record<string, string>).Authorization).toBe("Bearer new");
  });

  it("does not try to renew a failed login, which has no token", async () => {
    fetchMock.mockResolvedValue(json(401, { code: "INVALID_CREDENTIALS" }));

    await expect(api("/auth/login", "POST", {})).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

    expect(callsTo("/auth/refresh")).toHaveLength(0);
  });

  it("reports an expired session when renewal is refused", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    setAccessToken("old");
    fetchMock.mockResolvedValue(json(401, { code: "SESSION_EXPIRED" }));

    await expect(api("/auth/me")).rejects.toBeInstanceOf(ApiError);

    expect(expired).toHaveBeenCalledOnce();
  });

  it("keeps the session through a network failure during renewal", async () => {
    const expired = vi.fn();
    setSessionExpiredHandler(expired);
    setAccessToken("old");
    fetchMock.mockResolvedValueOnce(json(401, {})).mockRejectedValueOnce(new TypeError("offline"));

    await expect(api("/auth/me")).rejects.toBeInstanceOf(TypeError);

    expect(expired).not.toHaveBeenCalled();
  });

  it("shares one refresh between concurrent callers, because each token works only once", async () => {
    fetchMock.mockResolvedValue(json(200, { user, accessToken: "new" }));

    await Promise.all([refreshSession(), refreshSession(), refreshSession()]);

    expect(callsTo("/auth/refresh")).toHaveLength(1);
  });
});
