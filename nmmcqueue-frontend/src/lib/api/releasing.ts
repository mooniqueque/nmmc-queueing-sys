/**
 * Releasing (Window Clerk) API Client
 *
 * Typed fetch wrappers for the /api/releasing backend module.
 */
import { API_URL } from "./index";

export async function getPendingQueue(options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/pending`, {
        cache: "no-store",
        ...options,
    });
    return res.json();
}

export async function assignTicket(
    visitId: string,
    departmentId: string,
    priorityClass: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/assign`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentId, priorityClass }),
    });
    return res.json();
}
