import { getQueueOptionsByDepartment } from "@/app/(admin)/admin-dashboard/_actions/queue-option-actions";
import { getDepartments } from "@/app/actions/department-actions";
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { Department } from "@/types/models";
import { headers } from "next/headers";
import { connection } from "next/server";
import CallerDashboard from './caller';

export default async function CallerData() {
    await connection();

    let session = null;
    let departmentNames: string[] = [];
    let queueOptionsByDepartment = {};

    try {
        session = await auth.api.getSession({ headers: await headers() });
        const departmentResponse = await getDepartments();
        departmentNames = departmentResponse.data
            ? departmentResponse.data.map((department: Department) => department.name)
            : [];
        queueOptionsByDepartment = await getQueueOptionsByDepartment(departmentNames);
    } catch {
        // Build-time handle
    }

    return (
        <CallerDashboard
            loggedInUser={session?.user as unknown as SessionUser}
            departments={departmentNames}
            queueOptionsByDepartment={queueOptionsByDepartment}
        />
    );
}
