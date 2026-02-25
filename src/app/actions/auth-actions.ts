"use server";

import { auth } from "@/lib/database/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function forceLogoutAction() {
    // Await the cookies() promise in NextJS 15
    const cookieStore = await cookies();

    // Hard delete all potential Better-Auth session cookies securely from the server
    cookieStore.delete("better-auth.session_token");
    cookieStore.delete("better-auth.session_data");

    // Redirect to login page
    redirect("/login?error=session_expired");
}

export async function revokeOtherSessionsAction() {
    // Use the native Better-Auth API to instantly wipe all other sessions sharing this userId
    await auth.api.revokeOtherSessions({
        headers: await headers()
    });
}
