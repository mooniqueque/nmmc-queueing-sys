import { connection } from "next/server";
import { getPendingQueue } from "../_actions/triage-actions";
import { TriageEntry } from "./triage-entry";

export default async function TriageData() {
    await connection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pendingQueue: any[] = [];
    try {
        const response = await getPendingQueue();
        pendingQueue = response.success ? response.data : [];
    } catch {
        // Build-time handle
    }

    return <TriageEntry initialQueue={pendingQueue} />;
}
