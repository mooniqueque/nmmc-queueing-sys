"use server";

import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getServerHeaders() {
    const { headers } = await import("next/headers");
    const h = await headers();
    return {
        "Authorization": h.get("Authorization") || "",
        "Cookie": h.get("Cookie") || "",
    };
}

export async function getReleasingQueue() {
    try {
        const response = await fetch(`${BACKEND_URL}/releasing/pending`, {
            headers: await getServerHeaders(),
        });
        return await response.json();
    } catch {
        return { success: false, error: "Failed to fetch queue" };
    }
}

export async function callTicket(visitId: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/releasing/${visitId}/call`, {
            method: "POST",
            headers: await getServerHeaders(),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-releasing");
        return result;
    } catch {
        return { success: false, error: "Failed to call ticket" };
    }
}

export async function noShowTicket(visitId: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/releasing/${visitId}/noshow`, {
            method: "POST",
            headers: await getServerHeaders(),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-releasing");
        return result;
    } catch {
        return { success: false, error: "Failed to mark no-show" };
    }
}

export async function assignToClinic(visitId: string, data: { departmentId: string, priorityClass: string }) {
    try {
        const response = await fetch(`${BACKEND_URL}/releasing/${visitId}/assign`, {
            method: "POST",
            headers: {
                ...(await getServerHeaders()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-releasing");
        return result;
    } catch {
        return { success: false, error: "Failed to assign to clinic" };
    }
}
