import { connection } from "next/server";
import { getPendingQueue, getMyCurrentTriageVisit, getMyAccessibleDepartments } from "../actions";
import { TriageEntry } from "./triage-entry";
import { getServerHeaders } from "@/lib/api/server";
import { API_URL } from "@/lib/api";
import { AUTH_GET_VERIFIED_SESSION_URL } from "@/lib/config/auth-endpoints";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { VisitWithPatient } from "../types";

export default async function TriageData() {
    await connection();

    const headers = await getServerHeaders();
    
    let pendingQueue: VisitWithPatient[] = [];
    let currentVisit: VisitWithPatient | null = null;
    let session: { user: SessionUser } | null = null;
    let accessibleDepartments: Department[] = [];

    try {
        const [queueRes, currentRes, sessionRes, departmentsRes] = await Promise.all([
            getPendingQueue(),
            getMyCurrentTriageVisit(),
            fetch(AUTH_GET_VERIFIED_SESSION_URL, { headers }),
            getMyAccessibleDepartments(),
        ]);

        pendingQueue = queueRes.success ? queueRes.data : [];
        currentVisit = currentRes.success ? currentRes.data : null;
        if (sessionRes.ok) {
            session = await sessionRes.json();
        }
        accessibleDepartments = departmentsRes.success ? departmentsRes.data : [];
    } catch (error) {
        console.error("Error loading triage data:", error);
    }

    return <TriageEntry initialQueue={pendingQueue} currentVisit={currentVisit} user={session?.user} availableDepartments={accessibleDepartments} />;
}
