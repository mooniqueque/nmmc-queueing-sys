import { createAuthClient } from "better-auth/react";

//controls the components

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000",
    fetchOptions: {
        onError: async (context) => {
            const { error } = context;
            // Catch 401s, 403s, or "Failed to get session" errors which denote invalid/desynced sessions
            if (error?.status === 401 || error?.status === 403 || error?.message === "Failed to get session") {
                // Wipe local cookies proactively to prevent 'ghost session' caching loopholes
                document.cookie = "better-auth.session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "better-auth.session_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

                // Fast client-side navigation away from protected routes
                if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
                    window.location.href = "/login?error=session_expired";
                }
            }
        }
    }
});