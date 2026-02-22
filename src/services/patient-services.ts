import { db } from "@/lib/database/prisma";
;


/**
 * SERVICE: getPendingTriageVisits
 * Fetches all active visits that are waiting to be seen by the Triage Nurse.
 */

export async function getPendingTriageVisits() {
    try {
        const waitingVisits = await db.visit.findMany({
            where: {
                status: "KIOSK_SUBMITTED"
            },
            include: {
                //include patient full info
                patient: true
            },
            orderBy: {
                //fifo queue
                createdAt: 'asc'
            }
        });
        return { success: true, data: waitingVisits };
    } catch (error: unknown) {
        console.error("Failed to fetch pending visits:", error instanceof Error ? error.message : error);
        return { success: false, error: "Failed to load triage queue" };
    }
}