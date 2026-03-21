import { connection } from "next/server";
import { getPendingQueue, getMyCurrentTriageVisit } from "../actions";
import { TriageEntry } from "./triage-entry";
import { getServerHeaders } from "@/lib/api/server";
import { API_URL } from "@/lib/api";
import { SessionUser } from "@/types/auth";
import { VisitWithPatient } from "../types";

export default async function TriageData() {
    await connection();

    const headers = await getServerHeaders();
    
    let pendingQueue: VisitWithPatient[] = [];
    let currentVisit: VisitWithPatient | null = null;
    let session: { user: SessionUser } | null = null;

    try {
        const [queueRes, currentRes, sessionRes] = await Promise.all([
            getPendingQueue(),
            getMyCurrentTriageVisit(),
            fetch(`${API_URL}/auth/get-session`, { headers })
        ]);

        pendingQueue = queueRes.success ? queueRes.data : [];
        currentVisit = currentRes.success ? currentRes.data : null;
        if (sessionRes.ok) {
            session = await sessionRes.json();
        }
    } catch (error) {
        console.error("Error loading triage data:", error);
    }

    return <TriageEntry initialQueue={pendingQueue} currentVisit={currentVisit} user={session?.user} />;
}
