import { createAuthClient } from "better-auth/react";

//controls the components

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000",
});