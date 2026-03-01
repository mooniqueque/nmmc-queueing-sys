import { getQueueOptionsByDepartment } from '@/app/(admin)/admin-dashboard/_actions/queue-option-actions';
import { getDepartments } from '@/app/actions/department-actions';
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { Department } from "@/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import ReleasingDashboard from './releasing';

export default async function ReleasingData() {
    await connection();

    let session = null;
    let departments: Department[] = [];
    let queueOptionsByDepartment = {};

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const response = await getDepartments();
        departments = response.data || [];
        const departmentNames = departments.map((dept: Department) => dept.name);
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);
    } catch {
        // Build-time handle
    }

    return (
        <ReleasingDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departments as Department[]}
            queueOptionsByDepartment={queueOptionsByDepartment}
        />
    );
}
