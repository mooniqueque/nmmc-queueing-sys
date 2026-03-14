import { VisitWithPatient } from "@/features/triage/types";
import { auth } from "@/lib/database/auth";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import UserCallerDashboard from './user-caller-dashboard';

export default async function CallerData() {
    await connection();

    let session = null;
    let initialQueueData: VisitWithPatient[] = [];
    let userDepartment = ""; // Fallback

    try {
        session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            redirect("/login");
        }

        userDepartment = session.user.department as string;
        if (!userDepartment) {
            redirect("/login");
        }

        const { getClinicQueues } = await import('@/features/admin/clinic-queue-actions');
        // Fetch only for the specific user's department
        const pendingRes = await getClinicQueues(userDepartment);
        if (pendingRes.success) {
            initialQueueData = pendingRes.data;
        }

    } catch (error) {
        // Build-time handle or runtime error
        console.error("Failed to load Caller data:", error);
    }

    return (
        <UserCallerDashboard
            department={userDepartment}
            initialQueue={initialQueueData}
        />
    );
}
