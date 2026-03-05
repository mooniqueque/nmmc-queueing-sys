/**
 * Reports API Client
 *
 * Typed fetch wrappers for the /api/reports backend module.
 */
import { API_URL } from "@/lib/api";

export async function fetchReportVisits(
    filters: Record<string, unknown>,
    options?: RequestInit
) {
    try {
        const res = await fetch(`${API_URL}/reports/visits`, {
            method: "POST",
            ...options,
            headers: { "Content-Type": "application/json", ...options?.headers },
            body: JSON.stringify(filters),
        });
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}

export async function fetchDistinctStatuses(options?: RequestInit) {
    try {
        const res = await fetch(`${API_URL}/reports/statuses`, options);
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}
