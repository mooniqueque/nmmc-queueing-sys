"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { Department } from "@/types/models";
import { useState } from "react";
import { ReleasingForm } from "./releasing-form";
import { ReleasingLayout } from "./releasing-layout";
import { ReleasingQueueSidebar } from "./releasing-queue-sidebar";

interface ReleasingEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, string[]>;
}

export function ReleasingEntry({ initialQueue, departments, queueOptionsByDepartment }: ReleasingEntryProps) {
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);

    return (
        <ReleasingLayout
            sidebarSlot={
                <ReleasingQueueSidebar
                    initialQueue={initialQueue}
                    selectedPatientId={selectedPatient?.id}
                    onSelectPatient={setSelectedPatient}
                    onError={() => { }}
                />
            }
            contentSlot={
                <ReleasingForm
                    selectedPatient={selectedPatient}
                    setSelectedPatient={setSelectedPatient}
                    departments={departments}
                    queueOptionsByDepartment={queueOptionsByDepartment}
                />
            }
        />
    );
}
