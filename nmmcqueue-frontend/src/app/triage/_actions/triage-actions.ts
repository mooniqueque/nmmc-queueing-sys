"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(reqHeaders: Headers) {
    return {
        "Content-Type": "application/json",
        "cookie": reqHeaders.get("cookie") || ""
    };
}

export async function submitTriageForm(values: Record<string, unknown>, visitId?: string) {
    const res = await fetch(`${API_URL}/triage/submit`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ values, visitId })
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function getPendingQueue() {
    const res = await fetch(`${API_URL}/triage/pending`, {
        headers: getHeaders(await headers()),
        cache: "no-store"
    });
    return res.json();
}

export async function markNoShow(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}/no-show`, {
        method: "POST",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function restoreNoShow(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}/restore`, {
        method: "POST",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}

export async function removeQueue(visitId: string) {
    const res = await fetch(`${API_URL}/triage/${visitId}`, {
        method: "DELETE",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/triage");
    return res.json();
}
