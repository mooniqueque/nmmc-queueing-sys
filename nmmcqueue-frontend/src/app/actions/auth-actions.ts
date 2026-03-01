"use server"

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(reqHeaders: Headers) {
    return {
        "Content-Type": "application/json",
        "cookie": reqHeaders.get("cookie") || ""
    };
}

export async function revokeAllSessions() {
    const res = await fetch(`${API_URL}/auth/revoke-all-sessions`, {
        method: "POST",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/");
    return res.json();
}
