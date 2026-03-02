"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";

export async function getClinicQueues(departmentName?: string) {
    const url = departmentName
        ? `${API_URL}/clinic/pending?departmentName=${encodeURIComponent(departmentName)}`
        : `${API_URL}/clinic/pending`;

    const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });

    if (!res.ok) return { success: false, data: [] };
    return await res.json();
}
