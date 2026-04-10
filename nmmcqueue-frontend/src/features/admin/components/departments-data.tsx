import { getQueueOptionsByDepartment } from "@/features/admin/queue-option-actions";
import DepartmentSettings from "@/features/admin/components/admin-settings/departments";
import { getDepartments } from "@/features/admin/department-actions";
import { getAllUsers } from "@/features/admin/user-actions";
import { Department } from "@/shared/types/models";
import { connection } from "next/server";

type AdminUserRow = {
    name?: string;
    role?: string;
    isActive?: boolean;
    department?: string;
};

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

function pickLeadOfficer(users: AdminUserRow[]): string {
    if (users.length === 0) return "Unassigned";

    const rolePriority = ["ADMIN", "TRIAGE_NURSE", "CLINIC_CALLER", "WINDOW_CLERK"];
    const sorted = [...users].sort((a, b) => {
        const aIndex = rolePriority.indexOf((a.role ?? "").toUpperCase());
        const bIndex = rolePriority.indexOf((b.role ?? "").toUpperCase());
        const normalizedA = aIndex === -1 ? 99 : aIndex;
        const normalizedB = bIndex === -1 ? 99 : bIndex;
        return normalizedA - normalizedB;
    });

    return sorted[0]?.name || "Unassigned";
}

export default async function DepartmentsData() {
    await connection();

    let departments: Department[] = [];
    let queueOptionsByDepartment = {};
    let users: AdminUserRow[] = [];

    try {
        const [response, allUsers] = await Promise.all([
            getDepartments(),
            getAllUsers(),
        ]);

        departments = response.success && response.data ? response.data : [];
        users = Array.isArray(allUsers) ? (allUsers as AdminUserRow[]) : [];

        queueOptionsByDepartment = await getQueueOptionsByDepartment(
            departments.map((department: Department) => department.name)
        );
    } catch {
        // Build-time handle
    }

    const initialDepartmentInsights = departments.reduce<Record<string, { leadOfficer: string; staffCount: number }>>(
        (acc, department) => {
            const key = normalizeDepartmentKey(department.name);
            const matchingUsers = users.filter(
                (user) => normalizeDepartmentKey(user.department ?? "") === key
            );

            acc[department.id] = {
                leadOfficer: pickLeadOfficer(matchingUsers.filter((user) => user.isActive !== false)),
                staffCount: matchingUsers.length,
            };

            return acc;
        },
        {}
    );

    return (
        <div className="mx-auto mt-4 max-w-7xl p-6">
            <DepartmentSettings
                initialDepartments={departments as Department[]}
                initialQueueOptionsByDepartment={queueOptionsByDepartment}
                initialDepartmentInsights={initialDepartmentInsights}
            />
        </div>
    );
}
