/**
 * Shared API Client
 *
 * Typed fetch wrappers for the /api/shared backend module.
 * Provides public read-only reference data (departments, queue options)
 * used across the entire app (signup, admin, caller, releasing, reports).
 */
import { apiClient } from "@/lib/api";
import type { Department, PriorityCategory } from "@/shared/types/models";
import type { ApiResponse } from "@nmmc/types";

// ─── Departments (Read-Only) ──────────────────────────────────
export async function getDepartments(options?: RequestInit) {
    try {
        return await apiClient<Department[]>("/shared/departments", options);
    } catch {
        return { success: false, data: [] } as ApiResponse<Department[]>;
    }
}

// ─── Queue Options (Read-Only) ────────────────────────────────
export async function getQueueOptions(
    departmentName: string,
    options?: RequestInit
) {
    try {
        const response = await apiClient<PriorityCategory[]>(
            `/shared/queue-options?departmentName=${encodeURIComponent(departmentName)}`,
            options
        );
        return response.data ?? [];
    } catch {
        return [];
    }
}

export async function getQueueOptionsByDepartment(
    departmentNames: string[],
    options?: RequestInit
) {
    try {
        const response = await apiClient<Record<string, PriorityCategory[]>>("/shared/queue-options/batch", {
            method: "POST",
            ...options,
            headers: { "Content-Type": "application/json", ...options?.headers },
            body: JSON.stringify({ departments: departmentNames }),
        });
        return response.data ?? {};
    } catch {
        return {};
    }
}
