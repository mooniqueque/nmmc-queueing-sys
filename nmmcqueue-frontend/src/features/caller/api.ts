/**
 * Caller (Clinic Caller) API Client
 *
 * Typed fetch wrappers for the /api/caller backend module.
 * Handles caller-specific operations and admin management mutations.
 *
 * For shared read-only data (departments, queue-options), use @/features/shared/api
 */
import type { VisitWithPatient } from "@/features/triage/types";
import { apiClient } from "@/lib/api";
import type { PriorityCategory } from "@/shared/types/models";
import type { ApiResponse } from "@nmmc/types";

// ─── Admin Management (Mutations) ─────────────────────────────
export async function createDepartment(
    name: string,
    code: string,
    options?: RequestInit
) {
    return apiClient("/caller/departments", {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ name, code }),
    });
}

export async function deleteDepartment(id: string, options?: RequestInit) {
    return apiClient(`/caller/departments/${id}`, {
        method: "DELETE",
        ...options,
    });
}

export async function updateDepartmentStatus(
    id: string,
    status: "OPEN" | "CLOSED" | "FULL",
    options?: RequestInit
) {
    return apiClient(`/caller/departments/${id}/status`, {
        method: "PATCH",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ status }),
    });
}

export async function initializeDepartmentQueueDefaults(id: string, options?: RequestInit) {
    return apiClient<PriorityCategory[]>(`/caller/departments/${id}/queue-options/defaults`, {
        method: "POST",
        ...options,
    });
}

export async function repairDefaultQueueOptions(options?: RequestInit) {
    return apiClient<{ repairedDepartments: number }>("/caller/queue-options/repair-defaults", {
        method: "POST",
        ...options,
    });
}

export async function createQueueOption(
    departmentName: string,
    data: { name: string, code: string, isPriority: boolean, parentId?: string },
    options?: RequestInit
) {
    return apiClient<PriorityCategory>("/caller/queue-options", {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentName, data }),
    });
}

export async function deleteQueueOption(id: string, options?: RequestInit) {
    return apiClient(`/caller/queue-options/${id}`, {
        method: "DELETE",
        ...options,
    });
}

// ─── Clinic Queues (Caller-specific) ──────────────────────────
export async function getClinicQueues(
    departmentName?: string,
    options?: RequestInit
) {
    const url = departmentName
        ? `/caller/pending?departmentName=${encodeURIComponent(departmentName)}`
        : "/caller/pending";

    try {
        return await apiClient<VisitWithPatient[]>(url, { cache: "no-store", ...options });
    } catch {
        return { success: false, data: [] } as ApiResponse<VisitWithPatient[]>;
    }
}

export async function getCallerScope(options?: RequestInit) {
    try {
        return await apiClient<CallerScope>("/caller/scope", { cache: "no-store", ...options });
    } catch {
        return { success: false, data: null } as ApiResponse<CallerScope | null>;
    }
}

// ─── Operational Actions ──────────────────────────────────────

export async function callPatient(visitId: string, options?: RequestInit) {
    return apiClient<VisitWithPatient | null>(`/caller/visit/${encodeURIComponent(visitId)}/call`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
}

export async function callNextPatient(
    overrideClassification?: 'PRIORITY' | 'REGULAR',
    options?: RequestInit
) {
    return apiClient<VisitWithPatient | null>("/caller/call-next", {
        method: "POST",
        credentials: "include",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify(overrideClassification ? { overrideClassification } : {}),
    });
}

export async function servePatient(visitId: string, options?: RequestInit) {
    return apiClient(`/caller/visit/${encodeURIComponent(visitId)}/serve`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
}

export async function noShowPatient(visitId: string, options?: RequestInit) {
    return apiClient(`/caller/visit/${encodeURIComponent(visitId)}/no-show`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
}

export async function transferPatient(
    visitId: string,
    targetDepartmentId: string,
    options?: RequestInit
) {
    return apiClient(`/caller/visit/${encodeURIComponent(visitId)}/transfer`, {
        method: "POST",
        credentials: "include",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ targetDepartmentId }),
    });
}

export async function restorePatient(visitId: string, options?: RequestInit) {
    return apiClient(`/caller/visit/${encodeURIComponent(visitId)}/restore`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
}

export async function notifyPatient(visitId: string, options?: RequestInit) {
    return apiClient(`/caller/visit/${encodeURIComponent(visitId)}/notify`, {
        method: "POST",
        credentials: "include",
        ...options,
    });
}

export interface CallerScope {
    userId: string;
    departmentId: string;
    workstationId?: string;
    department: {
        id: string;
        name: string;
        code: string;
        slug?: string | null;
    };
}
