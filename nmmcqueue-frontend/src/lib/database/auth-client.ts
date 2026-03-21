import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"
import { AUTH_BASE_URL } from "@/lib/config/auth-endpoints"

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    plugins: [
        usernameClient()
    ]
})
