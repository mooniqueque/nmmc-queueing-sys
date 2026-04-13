import WorkstationSettings from "@/features/admin/components/admin-settings/workstations";
import { getDepartments } from "@/features/admin/department-actions";
import { getAllUsers } from "@/features/admin/user-actions";
import { getWorkstations } from "@/features/admin/workstation-actions";
import { auth } from "@/lib/database/auth";
import { AdminHeader } from "@/shared/layouts";
import { SessionUser, UserData } from "@/shared/types/auth";
import { Department, WorkStation } from "@/shared/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";

export default async function WorkstationsData() {
    await connection();

    let workstations: WorkStation[] = [];
    let departments: Department[] = [];
    let users: UserData[] = [];
    let user: SessionUser | undefined;

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        user = session?.user as unknown as SessionUser;

        const wsResponse = await getWorkstations();
        workstations = wsResponse.success && wsResponse.data ? wsResponse.data : [];
        
        const deptResponse = await getDepartments();
        departments = deptResponse.success && deptResponse.data ? deptResponse.data : [];

        const usersResponse = await getAllUsers();
        users = Array.isArray(usersResponse) ? (usersResponse as UserData[]) : [];
    } catch {
        // Build-time handle
    }

    return (
        <div className="flex flex-1 flex-col">
            {user && <AdminHeader user={user} title="Manage Workstations" />}
            <main className="flex-1 p-6 lg:p-8 max-w-400 mx-auto w-full">
                <WorkstationSettings 
                    initialWorkstations={workstations} 
                    departments={departments}
                    users={users}
                />
            </main>
        </div>
    );
}
