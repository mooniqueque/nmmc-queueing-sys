import { getDepartments } from "@/features/admin/department-actions";
import { getQueueOptionsByDepartment } from "@/features/admin/queue-option-actions";
import { VisitWithPatient } from "@/features/triage/types";
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import CallerDashboard from './caller-analytics-dashboard';

export default async function CallerData() {
    await connection();

    let session = null;
    let departmentNames: string[] = [];
    let queueOptionsByDepartment = {};
    let initialQueueData: VisitWithPatient[] = [];

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const departmentResponse = await getDepartments();
        departmentNames = departmentResponse.data
            ? departmentResponse.data.map((department: Department) => department.name)
            : [];
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);

        const { getClinicQueues } = await import('@/features/admin/clinic-queue-actions');
        // Fetch all pending at once for the initial load if no specific department provided
        const pendingRes = await getClinicQueues();
        if (pendingRes.success) initialQueueData = pendingRes.data ?? [];

    } catch {
        // Build-time handle
    }

    return (
        <CallerDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departmentNames}
            queueOptionsByDepartment={queueOptionsByDepartment}
            initialQueue={initialQueueData}
        />
    );
}
