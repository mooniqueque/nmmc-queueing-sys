import { getDepartments } from '@/features/admin/department-actions';
import { getAllUsers } from '@/features/admin/user-actions';
import { getWorkstations } from '@/features/admin/workstation-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/shared/types/auth";
import { Department, WorkStation } from "@/shared/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import AdminDashboard from './admin-dashboard-client';

export default async function AdminDashboardData() {
    await connection();

    let session = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsers: any[] = [];
    let departments: Department[] = [];
    let workstations: WorkStation[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
    } catch (error) {
        console.error("[AdminDashboardData] Failed to load session", error);
    }

    try {
        allUsers = await getAllUsers();
    } catch (error) {
        console.error("[AdminDashboardData] Failed to load users", error);
    }

    try {
        const response = await getDepartments();
        departments = response.success ? (response.data ?? []) : [];
    } catch (error) {
        console.error("[AdminDashboardData] Failed to load departments", error);
    }

    try {
        const wsResponse = await getWorkstations();
        workstations = wsResponse.success ? (wsResponse.data ?? []) : [];
    } catch (error) {
        console.error("[AdminDashboardData] Failed to load workstations", error);
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
