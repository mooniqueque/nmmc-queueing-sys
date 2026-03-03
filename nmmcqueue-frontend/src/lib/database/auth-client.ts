import { createAuthClient } from "better-auth/react"
import type { auth } from "../../../../nmmcqueue-backend/src/modules/auth/auth"

export const authClient = createAuthClient<typeof auth>({
    baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/auth` : "http://localhost:3001/api/auth"
})
