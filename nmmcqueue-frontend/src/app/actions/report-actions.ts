"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";

export async function fetchReportVisitsAPI(filters: Record<string, unknown>) {
    try {
        const res = await fetch(`${API_URL}/reports/visits`, {
            method: "POST",
            headers: await getAuthHeaders(),
            body: JSON.stringify(filters)
        });
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}

export async function fetchDistinctStatusesAPI() {
    try {
        const res = await fetch(`${API_URL}/reports/statuses`, {
            headers: await getAuthHeaders()
        });
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}
