import { getQueueOptionsByDepartment } from "@/features/admin/queue-option-actions";
import DepartmentSettings from "@/features/admin/components/admin-settings/departments";
import { getDepartments } from "@/features/admin/department-actions";
import { Department } from "@/types/models";
import { connection } from "next/server";

export default async function DepartmentsData() {
    await connection();

    let departments: Department[] = [];
    let queueOptionsByDepartment = {};

    try {
        const response = await getDepartments();
        departments = response.success && response.data ? response.data : [];
        queueOptionsByDepartment = await getQueueOptionsByDepartment(
            departments.map((department: Department) => department.name)
        );
    } catch {
        // Build-time handle
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mt-4">
            <h1 className="text-2xl font-bold text-emerald-950 mb-6 drop-shadow-sm">Manage Departments</h1>
            <DepartmentSettings initialDepartments={departments as Department[]} initialQueueOptionsByDepartment={queueOptionsByDepartment} />
        </div>
    );
}
