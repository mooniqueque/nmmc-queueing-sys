import { getDepartments } from '@/features/admin/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import ReleasingDashboard from './releasing-analytics-dashboard';

export default async function ReleasingData() {
    await connection();

    let session = null;
    let departments: Department[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const deptResponse = await getDepartments();
        departments = deptResponse.success && deptResponse.data ? deptResponse.data : [];
    } catch {
        // Build-time handle
    }

    return (
        <ReleasingDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departments}
        />
    );
}
