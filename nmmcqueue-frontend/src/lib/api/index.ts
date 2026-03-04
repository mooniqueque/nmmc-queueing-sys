/**
 * API Client Configuration
 *
 * Base configuration for all API calls to the Express backend.
 * Provides helpers for both server-side and client-side usage.
 *
 * Server-side (Server Components / Server Actions):
 *   Use `getServerHeaders()` to forward cookies from the incoming request.
 *
 * Client-side (Client Components / TanStack Query):
 *   Use `{ credentials: 'include' }` to send cookies directly.
 */
import { headers } from "next/headers";

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Builds headers for server-side API calls (Server Components & Server Actions).
 * Forwards the incoming request's cookie to the Express backend.
 *
 * ⚠️  This function uses `next/headers` and can ONLY be called from server contexts.
 */
export async function getServerHeaders(): Promise<HeadersInit> {
    const reqHeaders = await headers();
    return {
        "Content-Type": "application/json",
        cookie: reqHeaders.get("cookie") || "",
    };
}
