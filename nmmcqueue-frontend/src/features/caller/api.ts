/**
 * Caller (Clinic Caller) API Client
 *
 * Typed fetch wrappers for the /api/caller backend module.
 * Handles departments, queue options, and clinic pending queues.
 */
import { API_URL } from "@/lib/api";

// ─── Departments ──────────────────────────────────────────────
export async function getDepartments(options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/departments`, options);
    if (!res.ok) return { success: false, data: [] };
    return res.json();
}

export async function createDepartment(
    name: string,
    code: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/caller/departments`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ name, code }),
    });
    return res.json();
}

export async function deleteDepartment(id: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/departments/${id}`, {
        method: "DELETE",
        ...options,
    });
    return res.json();
}

// ─── Queue Options ────────────────────────────────────────────
export async function getQueueOptions(
    departmentName: string,
    options?: RequestInit
) {
    const res = await fetch(
        `${API_URL}/caller/queue-options?departmentName=${encodeURIComponent(departmentName)}`,
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
    const res = await fetch(`${API_URL}/caller/queue-options/batch`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departments: departmentNames }),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data;
}

export async function createQueueOption(
    departmentName: string,
    option: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/caller/queue-options`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentName, option }),
    });
    return res.json();
}

export async function deleteQueueOption(
    departmentName: string,
    option: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/caller/queue-options`, {
        method: "DELETE",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentName, option }),
    });
    return res.json();
}

// ─── Clinic Queues ────────────────────────────────────────────
export async function getClinicQueues(
    departmentName?: string,
    options?: RequestInit
) {
    const url = departmentName
        ? `${API_URL}/caller/pending?departmentName=${encodeURIComponent(departmentName)}`
        : `${API_URL}/caller/pending`;

    const res = await fetch(url, { cache: "no-store", ...options });
    if (!res.ok) return { success: false, data: [] };
    return res.json();
}
