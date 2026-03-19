/**
 * Server-side auth proxy for Next.js server components and layouts.
 * Forwards session requests to the Express backend (better-auth).
 * Use authClient from "@/lib/database/auth-client" for client components instead.
 */

import { AUTH_GET_SESSION_URL, hasSessionUser, type SessionLike } from "@/lib/config/auth-endpoints";

interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: string;
    [key: string]: unknown;
}

interface Session extends SessionLike {
    user: SessionUser;
    session: { id: string; token: string; expiresAt: string };
}

export const auth = {
    api: {
        getSession: async (opts: { headers: Headers | Record<string, string> }): Promise<Session | null> => {
            try {
                const res = await fetch(AUTH_GET_SESSION_URL, {
                    headers: opts.headers as Record<string, string>,
                    cache: "no-store",
                });
                if (!res.ok) return null;
                const data: unknown = await res.json();
                // better-auth may return null/empty payload when unauthenticated.
                if (!hasSessionUser(data)) return null;
                return data as Session;
            } catch {
                return null;
            }
        },
    },
};
