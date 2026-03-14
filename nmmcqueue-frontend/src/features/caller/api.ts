/**
 * Caller (Clinic Caller) API Client
 *
 * Typed fetch wrappers for the /api/caller backend module.
 * Handles caller-specific operations and admin management mutations.
 *
 * For shared read-only data (departments, queue-options), use @/features/shared/api
 */
import { API_URL } from "@/lib/api";

// ─── Admin Management (Mutations) ─────────────────────────────
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

export async function createQueueOption(
    departmentName: string,
    data: { name: string, code: string, isPriority: boolean, parentId?: string },
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/caller/queue-options`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentName, data }),
    });
    return res.json();
}

export async function deleteQueueOption(id: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/queue-options/${id}`, {
        method: "DELETE",
        ...options,
    });
    return res.json();
}

// ─── Clinic Queues (Caller-specific) ──────────────────────────
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

// ─── Operational Actions ──────────────────────────────────────

export async function callPatient(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/call`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
    return res.json();
}

export async function servePatient(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/serve`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
    return res.json();
}

export async function noShowPatient(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/no-show`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
    return res.json();
}

export async function transferPatient(
    visitId: string,
    targetDepartmentId: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/transfer`, {
        method: "POST",
        credentials: "include",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ targetDepartmentId }),
    });
    return res.json();
}

export async function restorePatient(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/restore`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
    return res.json();
}

export async function notifyPatient(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/caller/visit/${encodeURIComponent(visitId)}/notify`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
    return res.json();
}
