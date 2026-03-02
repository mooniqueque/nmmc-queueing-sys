import { getQueueOptionsByDepartment } from "@/app/(admin)/admin-dashboard/_actions/queue-option-actions";
import { VisitWithPatient } from "@/app/(staffs)/triage/_types";
import { auth } from "@/lib/database/auth";
import { SessionUser } from "@/lib/types/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import UserCallerDashboard from './user-caller-dashboard';

export default async function CallerData() {
    await connection();

    let session = null;
    let queueOptionsByDepartment = {};
    let initialQueueData: VisitWithPatient[] = [];
    let userDepartment = "ANIMAL BITE DEPT"; // Fallback

    try {
        session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            redirect("/login");
        }

        userDepartment = session.user.department as string;
        if (!userDepartment) {
            redirect("/login");
        }
        queueOptionsByDepartment = await getQueueOptionsByDepartment([userDepartment]);

        const { getClinicQueues } = await import('@/app/(admin)/admin-dashboard/_actions/clinic-queue-actions');
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
            loggedInUser={session?.user as unknown as SessionUser}
            department={userDepartment}
            queueOptionsByDepartment={queueOptionsByDepartment}
            initialQueue={initialQueueData}
        />
    );
}
