"use client";

import { VisitWithPatient } from "@/app/triage/_types";
import { Department } from "@/types/models";
import { useState } from "react";
import { ClerkForm } from "./clerk-form";
import { ClerkLayout } from "./clerk-layout";
import { ClerkQueueSidebar } from "./clerk-queue-sidebar";

interface ClerkEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, string[]>;
}

export function ClerkEntry({ initialQueue, departments, queueOptionsByDepartment }: ClerkEntryProps) {
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);

    return (
        <ClerkLayout
            sidebarSlot={
                <ClerkQueueSidebar
                    initialQueue={initialQueue}
                    selectedPatientId={selectedPatient?.id}
                    onSelectPatient={setSelectedPatient}
                    onError={() => { }}
                />
            }
            contentSlot={
                <ClerkForm
                    selectedPatient={selectedPatient}
                    setSelectedPatient={setSelectedPatient}
                    departments={departments}
                    queueOptionsByDepartment={queueOptionsByDepartment}
                />
            }
        />
    );
}
