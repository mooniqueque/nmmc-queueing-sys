/**
 * Shared API Client
 *
 * Typed fetch wrappers for the /api/shared backend module.
 * Provides public read-only reference data (departments, queue options)
 * used across the entire app (signup, admin, caller, releasing, reports).
 */
import { API_URL } from "@/lib/api";

// ─── Departments (Read-Only) ──────────────────────────────────
export async function getDepartments(options?: RequestInit) {
    const res = await fetch(`${API_URL}/shared/departments`, options);
    if (!res.ok) return { success: false, data: [] };
    return res.json();
}

// ─── Queue Options (Read-Only) ────────────────────────────────
export async function getQueueOptions(
    departmentName: string,
    options?: RequestInit
) {
    const res = await fetch(
        `${API_URL}/shared/queue-options?departmentName=${encodeURIComponent(departmentName)}`,
        options
    );
    if (!res.ok) return ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];
    const json = await res.json();
    return json.data;
}

export async function getQueueOptionsByDepartment(
    departmentNames: string[],
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/shared/queue-options/batch`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departments: departmentNames }),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data;
}
