import { db as prisma } from "@/lib/database/prisma";
import TriageDashboardClient from "./_client/triage-client";

export default async function TriageDashboardPage() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch everyone waiting for Triage TODAY
    const pendingQueue = await prisma.visit.findMany({
        where: {
            status: "KIOSK_SUBMITTED",
            createdAt: { gte: today }
        },
        include: {
            patient: true // Pulls in their First/Last name
        },
        orderBy: {
            createdAt: 'asc' // FIFO: Oldest ones first!
        }
    });

    return <TriageDashboardClient initialQueue={pendingQueue} />;
}
