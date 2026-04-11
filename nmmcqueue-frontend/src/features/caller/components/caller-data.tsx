import { VisitWithPatient } from "@/features/triage/types";
import { getServerHeaders } from "@/lib/api/server";
import { connection } from "next/server";
import UserCallerDashboard from './user-caller-dashboard';
import { getCallerScope, getClinicQueues } from "../api";

export default async function CallerData() {
    await connection();

    let initialQueueData: VisitWithPatient[] = [];
    let userDepartment = "";

    try {
        const headers = await getServerHeaders();
        const [scopeRes, pendingRes] = await Promise.all([
            getCallerScope({ headers }),
            getClinicQueues(undefined, { headers }),
        ]);

        if (scopeRes.success) {
            userDepartment = scopeRes.data?.department?.name ?? "";
        }

        if (pendingRes.success) {
            initialQueueData = pendingRes.data ?? [];
        }

        if (!userDepartment && initialQueueData.length > 0) {
            userDepartment = initialQueueData[0]?.department?.name ?? "";
        }

    } catch (error) {
        console.error("Failed to load Caller data:", error);
    }

    return (
        <UserCallerDashboard
            department={userDepartment}
            initialQueue={initialQueueData}
        />
    );
}
