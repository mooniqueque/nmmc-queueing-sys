"use server"
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function revokeAllSessions() {
    const res = await fetch(`${API_URL}/auth/revoke-all-sessions`, {
        method: "POST",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/");
    return res.json();
}
