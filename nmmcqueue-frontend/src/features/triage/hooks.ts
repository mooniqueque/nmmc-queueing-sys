"use client";

import { useLiveQueue } from "@/shared/hooks/use-live-queue";
import { removeVisitById, SSE_TOPICS, upsertVisitById } from "@/shared/lib/sse";
import { VisitStatus } from "@/shared/types/models";
import { useCallback, useEffect, useState } from "react";
import { VisitWithPatient } from "./types";

export type TabType = "ACTIVE" | "NO_SHOW" | "REPORTS";

const isTriageScopedNoShow = (visit: VisitWithPatient) =>
    visit.status === VisitStatus.NO_SHOW && !visit.sequenceKey;

export function useTriageQueue(initialQueue: VisitWithPatient[], initialCurrentVisit: VisitWithPatient | null, userId?: string) {
    const [queue, setQueue] = useState(initialQueue);
    const [claimedVisit, setClaimedVisit] = useState<VisitWithPatient | null>(initialCurrentVisit);

    useEffect(() => {
        setQueue(initialQueue);
    }, [initialQueue]);

    useEffect(() => {
        setClaimedVisit(initialCurrentVisit);
    }, [initialCurrentVisit]);

    const handleLiveEvent = useCallback((event: { type: string; payload?: { visit?: VisitWithPatient; visitId?: string } }) => {
        if (event.type === "visit-upsert" && event.payload?.visit) {
            const visit = event.payload.visit;

            // Enforce owner-scoped triage NO_SHOW visibility in real time.
            if (visit.status === VisitStatus.NO_SHOW && !visit.sequenceKey) {
                if (userId && visit.calledByUserId && visit.calledByUserId !== userId) {
                    setQueue((current) => removeVisitById(current, visit.id));
                    return;
                }
            }
            
            // TASK 2 FIX: Only set as claimedVisit if it belongs to US
            if (visit.status === VisitStatus.IN_TRIAGE) {
                if (userId && visit.triageClaimedById === userId) {
                    setClaimedVisit(visit);
                }
                // Always remove from the waiting list if it's now IN_TRIAGE (claimed by anyone)
                setQueue((current) => removeVisitById(current, visit.id));
                return;
            }

            // Normal WAITING_TRIAGE or NO_SHOW updates
            setQueue((current) => upsertVisitById(current, visit));
            
            // If the visit being updated was our claimed visit (e.g. status changed away from IN_TRIAGE)
            if (claimedVisit?.id === visit.id) {
                setClaimedVisit(null);
            }
            return;
        }

        if (event.type === "visit-remove" && event.payload?.visitId) {
            const visitId = event.payload.visitId;
            setQueue((current) => removeVisitById(current, visitId));
            if (claimedVisit?.id === visitId) {
                setClaimedVisit(null);
            }
        }
    }, [userId, claimedVisit?.id]);

    useLiveQueue(SSE_TOPICS.TRIAGE, handleLiveEvent);

    const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");

    const activeQueue = queue.filter(v => v.status === VisitStatus.WAITING_TRIAGE);
    const noShowQueue = queue.filter(isTriageScopedNoShow);

    return {
        activeQueue,
        noShowQueue,
        claimedVisit,
        activeTab,
        setActiveTab
    };
}
