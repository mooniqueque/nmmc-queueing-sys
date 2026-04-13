import { describe, it, expect, vi, beforeEach } from "vitest";

import middleware from "../../../nmmcqueue-frontend/src/middleware";

describe("Auth flow integration via middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login to protected page then logout flow redirects correctly", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { role: "ADMIN" } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { role: "ADMIN" } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) as unknown as typeof fetch
    );

    const loginRequest = {
      url: "http://localhost:3000/login",
      nextUrl: { pathname: "/login" },
      headers: { get: vi.fn(() => "cookie=admin") },
    } as any;

    const protectedRequest = {
      url: "http://localhost:3000/admin-dashboard",
      nextUrl: { pathname: "/admin-dashboard" },
      headers: { get: vi.fn(() => "cookie=admin") },
    } as any;

    const postLogoutRequest = {
      url: "http://localhost:3000/admin-dashboard",
      nextUrl: { pathname: "/admin-dashboard" },
      headers: { get: vi.fn(() => "") },
    } as any;

    const loginResponse = await middleware(loginRequest);
    const protectedResponse = await middleware(protectedRequest);
    const logoutResponse = await middleware(postLogoutRequest);

    expect(loginResponse.status).toBe(307);
    expect(loginResponse.headers.get("location")).toBe("http://localhost:3000/admin-dashboard");

    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.headers.get("x-middleware-next")).toBe("1");

    expect(logoutResponse.status).toBe(307);
    expect(logoutResponse.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
