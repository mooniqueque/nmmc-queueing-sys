"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function getPendingQueue() {
    const res = await fetch(`${API_URL}/clerk/pending`, {
        headers: await getAuthHeaders(),
        cache: "no-store"
    });
    const json = await res.json();
    return json;
}

export async function assignTicket(visitId: string, departmentId: string, priorityClass: string) {
    const res = await fetch(`${API_URL}/clerk/${visitId}/assign`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ departmentId, priorityClass })
    });
    if (res.ok) {
        revalidatePath("/releasing", "page");
    }
    return res.json();
}
