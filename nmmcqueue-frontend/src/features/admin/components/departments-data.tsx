import { getQueueOptionsByDepartment } from "@/features/admin/queue-option-actions";
import DepartmentSettings from "@/features/admin/components/admin-settings/departments";
import { getDepartments } from "@/features/admin/department-actions";
import { Department } from "@/shared/types/models";
import { connection } from "next/server";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/types/auth";
import { AdminHeader } from "@/shared/layouts";

export default async function DepartmentsData() {
    await connection();

    let departments: Department[] = [];
    let queueOptionsByDepartment = {};
    let user: SessionUser | undefined;

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        user = session?.user as unknown as SessionUser;

        const response = await getDepartments();
        departments = response.success && response.data ? response.data : [];
        queueOptionsByDepartment = await getQueueOptionsByDepartment(
            departments.map((department: Department) => department.name)
        );
    } catch {
        // Build-time handle
    }

    return (
        <div className="flex flex-1 flex-col">
            {user && <AdminHeader user={user} title="Manage Departments" />}
            <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <DepartmentSettings initialDepartments={departments as Department[]} initialQueueOptionsByDepartment={queueOptionsByDepartment} />
            </main>
        </div>
    );
}
