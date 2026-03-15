import { getQueueOptionsByDepartment } from '@/features/admin/queue-option-actions';
import { getDepartments } from '@/features/admin/department-actions';
import { getReleasingQueue } from '@/features/admin/releasing-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/types/auth";
import { Department, Visit } from "@/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import ReleasingDashboard from './releasing';

export default async function ReleasingData() {
    await connection();

    let session = null;
    let departments: Department[] = [];
    let queueOptionsByDepartment = {};
    let initialQueue: Visit[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const deptResponse = await getDepartments();
        departments = deptResponse.success && deptResponse.data ? deptResponse.data : [];
        
        const queueResponse = await getReleasingQueue();
        initialQueue = queueResponse.success && queueResponse.data ? queueResponse.data : [];

        const departmentNames = departments.map((dept: Department) => dept.name);
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);
    } catch {
        // Build-time handle
    }

    return (
        <ReleasingDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departments}
            initialQueue={initialQueue}
            queueOptionsByDepartment={queueOptionsByDepartment}
        />
    );
}
