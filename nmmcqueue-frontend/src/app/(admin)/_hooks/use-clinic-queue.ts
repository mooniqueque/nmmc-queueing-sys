"use client";

import { useCallback, useEffect, useState } from "react";
import { VisitWithPatient } from "@/features/triage/types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";
import { removeVisitById, SSE_TOPICS, upsertVisitById } from "@/shared/lib/sse";

const isOwnedClinicNoShow = (visit: VisitWithPatient, userId?: string) =>
    visit.status === "NO_SHOW" &&
    Boolean(visit.sequenceKey?.startsWith("DEPT_")) &&
    Boolean(userId) &&
    visit.calledByUserId === userId;

export function useClinicQueue(departmentId: string, initialQueue: VisitWithPatient[], userId?: string) {
    const [queue, setQueue] = useState(initialQueue);

    useEffect(() => {
        setQueue(initialQueue);
    }, [initialQueue]);

    const handleLiveEvent = useCallback((event: { type: string; payload?: { visit?: VisitWithPatient; visitId?: string } }) => {
        if (event.type === "visit-upsert" && event.payload?.visit) {
            const visit = event.payload.visit;

            if (visit.status === "NO_SHOW" && Boolean(visit.sequenceKey?.startsWith("DEPT_"))) {
                if (!isOwnedClinicNoShow(visit, userId)) {
                    setQueue((current) => removeVisitById(current, visit.id));
                    return;
                }
            }

            setQueue((current) => upsertVisitById(current, visit));
            return;
        }

        if (event.type === "visit-remove" && event.payload?.visitId) {
            setQueue((current) => removeVisitById(current, event.payload!.visitId!));
        }
    }, [userId]);

    const activeQueue = queue.filter((visit) => {
        if (visit.status !== "NO_SHOW") return true;
        if (!visit.sequenceKey?.startsWith("DEPT_")) return true;
        return isOwnedClinicNoShow(visit, userId);
    });

    useLiveQueue(SSE_TOPICS.department(departmentId), handleLiveEvent);

    return { activeQueue };
}
