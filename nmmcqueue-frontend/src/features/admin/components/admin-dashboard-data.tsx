import { getAllUsers } from '@/features/admin/user-actions';
import { getWorkstations } from '@/features/admin/workstation-actions';
import { getDepartments } from '@/features/admin/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/types/auth";
import { Department, WorkStation } from "@/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import AdminDashboard from './admin';

export default async function AdminDashboardData() {
    await connection();

    let session = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsers: any[] = [];
    let departments: Department[] = [];
    let workstations: WorkStation[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
        allUsers = await getAllUsers();
        const response = await getDepartments();
        departments = response.success ? response.data : [];
        const wsResponse = await getWorkstations();
        workstations = wsResponse.success ? wsResponse.data : [];
    } catch {
        // Handle error
    }

    return (
        <AdminDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            initialUsers={allUsers}
            departments={departments as Department[]}
            workstations={workstations as WorkStation[]}
        />
    );
}
