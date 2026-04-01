"use client";

import { useState } from "react";
import { VisitWithPatient } from "./types";
import { useLiveQueue } from "@/shared/hooks/use-live-queue";

export type TabType = "ACTIVE" | "NO_SHOW" | "HISTORY";

export function useTriageQueue(initialQueue: VisitWithPatient[]) {
    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useLiveQueue();

    const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");

    const activeQueue = initialQueue.filter(v => v.status === "WAITING_TRIAGE");
    const noShowQueue = initialQueue.filter(v => v.status === "NO_SHOW");

    return {
        activeQueue,
        noShowQueue,
        activeTab,
        setActiveTab
    };
}
