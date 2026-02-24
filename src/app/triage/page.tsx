import { db as prisma } from "@/lib/database/prisma";
import { TriageEntry } from "./_components/triage-entry";

export default async function TriageDashboardPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch everyone waiting for Triage TODAY
    const pendingQueue = await prisma.visit.findMany({
        where: {
            status: { in: ["KIOSK_SUBMITTED", "NO_SHOW"] },
            createdAt: { gte: today }
        },
        include: {
            patient: true // Pulls in their First/Last name
        },
        orderBy: {
            createdAt: 'asc' // FIFO: Oldest ones first!
        }
    });

    return <TriageEntry initialQueue={pendingQueue} />;
}
