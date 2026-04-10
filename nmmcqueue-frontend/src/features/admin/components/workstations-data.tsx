import { getWorkstations } from "@/features/admin/workstation-actions";
import { getDepartments } from "@/features/admin/department-actions";
import WorkstationSettings from "@/features/admin/components/admin-settings/workstations";
import { WorkStation, Department } from "@/shared/types/models";
import { connection } from "next/server";
import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { SessionUser } from "@/types/auth";
import { AdminHeader } from "@/shared/layouts";

export default async function WorkstationsData() {
    await connection();

    let workstations: WorkStation[] = [];
    let departments: Department[] = [];
    let user: SessionUser | undefined;

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        user = session?.user as unknown as SessionUser;

        const wsResponse = await getWorkstations();
        workstations = wsResponse.success && wsResponse.data ? wsResponse.data : [];
        
        const deptResponse = await getDepartments();
        departments = deptResponse.success && deptResponse.data ? deptResponse.data : [];
    } catch {
        // Build-time handle
    }

    return (
        <div className="flex flex-1 flex-col">
            {user && <AdminHeader user={user} title="Manage Workstations" />}
            <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
                <WorkstationSettings 
                    initialWorkstations={workstations} 
                    departments={departments}
                />
            </main>
        </div>
    );
}
