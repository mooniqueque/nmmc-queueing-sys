import type { DepartmentSummary } from "@nmmc/types";
import { apiClient } from "./index";

export async function getAllDepartments() {
    try {
        const response = await apiClient<DepartmentSummary[]>("/shared/departments", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        return response.data ?? [];
    } catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}
