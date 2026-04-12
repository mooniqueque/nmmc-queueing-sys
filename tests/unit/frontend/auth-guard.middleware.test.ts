import { describe, it, expect, vi, beforeEach } from "vitest";

import middleware from "../../../nmmcqueue-frontend/src/middleware";

describe("Auth guard middleware unit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated user from protected route to login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch
    );

    const request = {
      url: "http://localhost:3000/caller",
      nextUrl: { pathname: "/caller" },
      headers: { get: vi.fn(() => "") },
    } as any;

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("allows authenticated user on matching protected route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ user: { role: "CLINIC_CALLER" } }),
      })) as unknown as typeof fetch
    );

    const request = {
      url: "http://localhost:3000/caller",
      nextUrl: { pathname: "/caller" },
      headers: { get: vi.fn(() => "cookie=ok") },
    } as any;

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
