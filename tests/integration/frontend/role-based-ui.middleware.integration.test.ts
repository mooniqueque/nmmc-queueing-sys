import { describe, it, expect, vi, beforeEach } from "vitest";

import middleware from "../../../nmmcqueue-frontend/src/middleware";

describe("Role-based access integration via middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows admin and blocks clerk from admin dashboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { role: "ADMIN" } }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { role: "WINDOW_CLERK" } }) }) as unknown as typeof fetch
    );

    const adminRequest = {
      url: "http://localhost:3000/admin-dashboard",
      nextUrl: { pathname: "/admin-dashboard" },
      headers: { get: vi.fn(() => "cookie=admin") },
    } as any;

    const clerkRequest = {
      url: "http://localhost:3000/admin-dashboard",
      nextUrl: { pathname: "/admin-dashboard" },
      headers: { get: vi.fn(() => "cookie=clerk") },
    } as any;

    const adminResponse = await middleware(adminRequest);
    const clerkResponse = await middleware(clerkRequest);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.headers.get("x-middleware-next")).toBe("1");

    expect(clerkResponse.status).toBe(307);
    expect(clerkResponse.headers.get("location")).toBe("http://localhost:3000/");
  });
});
