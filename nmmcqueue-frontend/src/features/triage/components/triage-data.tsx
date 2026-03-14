import { connection } from "next/server";
import { getPendingQueue } from "../actions";
import { TriageEntry } from "./triage-entry";
import { getServerHeaders } from "@/lib/api/server";
import { API_URL } from "@/lib/api";
import { SessionUser } from "@/types/auth";
import { VisitWithPatient } from "../types";

export default async function TriageData() {
    await connection();

    const headers = await getServerHeaders();
    
    let pendingQueue: VisitWithPatient[] = [];
    let session: { user: SessionUser } | null = null;

    try {
        const [queueRes, sessionRes] = await Promise.all([
            getPendingQueue(),
            fetch(`${API_URL}/auth/get-session`, { headers })
        ]);

        pendingQueue = queueRes.success ? queueRes.data : [];
        if (sessionRes.ok) {
            session = await sessionRes.json();
        }
    } catch (error) {
        console.error("Error loading triage data:", error);
    }

    return <TriageEntry initialQueue={pendingQueue} user={session?.user} />;
}
