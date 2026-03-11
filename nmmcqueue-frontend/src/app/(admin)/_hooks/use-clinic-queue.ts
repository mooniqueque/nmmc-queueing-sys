"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/hooks/use-live-queue";

export function useClinicQueue(departmentId: string, initialQueue: VisitWithPatient[]) {
    // In a real scenario we might filter this locally or rely on the backend strictly returning WAITING_CLINIC for this department
    const activeQueue = initialQueue;
    
    // Pass the specific department topic to the stream
    useLiveQueue(departmentId);

    return { activeQueue };
}
