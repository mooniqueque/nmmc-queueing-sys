/**
 * Server-side auth proxy for Next.js server components and layouts.
 * Forwards session requests to the Express backend (better-auth).
 * Use authClient from "@/lib/database/auth-client" for client components instead.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: string;
    isApproved: boolean;
    [key: string]: unknown;
}

interface Session {
    user: SessionUser;
    session: { id: string; token: string; expiresAt: string };
}

export const auth = {
    api: {
        getSession: async (opts: { headers: Headers | Record<string, string> }): Promise<Session | null> => {
            try {
                const res = await fetch(`${API_URL}/auth/get-session`, {
                    headers: opts.headers as Record<string, string>,
                    cache: "no-store",
                });
                if (!res.ok) return null;
                const data = await res.json();
                // better-auth returns null body or empty object for unauthenticated
                if (!data?.user) return null;
                return data as Session;
            } catch {
                return null;
            }
        },
    },
};
