"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function submitTriageForm(values: Record<string, unknown>, visitId?: string) {
    const res = await fetch(`${API_URL}/triage/submit`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ values, visitId })
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function getPendingQueue() {
    const res = await fetch(`${API_URL}/triage/pending`, {
        headers: await getAuthHeaders(),
        cache: "no-store"
    });
    return res.json();
}

export async function markNoShow(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}/no-show`, {
        method: "POST",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function restoreNoShow(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}/restore`, {
        method: "POST",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function removeQueue(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}
