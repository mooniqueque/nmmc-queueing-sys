import { getPendingQueue } from "./_actions/triage-actions";
import { TriageEntry } from "./_components/triage-entry";

export default async function TriageDashboardPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch everyone waiting for Triage TODAY via Backend API
    const response = await getPendingQueue();
    const pendingQueue = response.success ? response.data : [];

    return <TriageEntry initialQueue={pendingQueue} />;
}
