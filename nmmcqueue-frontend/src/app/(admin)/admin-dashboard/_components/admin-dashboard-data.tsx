import { getAllUsers } from '@/app/(admin)/admin-dashboard/_actions/user-actions';
import { getDepartments } from '@/app/actions/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { Department } from "@/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import AdminDashboard from './admin';

export default async function AdminDashboardData() {
    await connection();

    let session = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allUsers: any[] = [];
    let departments: Department[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
        allUsers = await getAllUsers();
        const response = await getDepartments();
        departments = response.success ? response.data : [];
    } catch {
        // Build-time handle
    }

    return (
        <AdminDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            initialUsers={allUsers}
            departments={departments as Department[]}
        />
    );
}
