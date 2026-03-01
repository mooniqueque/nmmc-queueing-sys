"use client";

import { useState } from "react";
import { VisitWithPatient } from "../_types";
import { TriageForm } from "./triage-form";
import { TriageLayout } from "./triage-layout";
import { TriageQueueSidebar } from "./triage-queue-sidebar";

interface TriageEntryProps {
    initialQueue: VisitWithPatient[];
}

export function TriageEntry({ initialQueue }: TriageEntryProps) {
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
    const [submitError, setSubmitError] = useState("");

    return (
        <TriageLayout
            sidebarSlot={
                <TriageQueueSidebar
                    initialQueue={initialQueue}
                    isManualEntry={isManualEntry}
                    selectedPatientId={selectedPatient?.id}
                    onSelectPatient={setSelectedPatient}
                    onError={setSubmitError}
                />
            }
            contentSlot={
                <TriageForm
                    isManualEntry={isManualEntry}
                    setIsManualEntry={setIsManualEntry}
                    selectedPatient={selectedPatient}
                    setSelectedPatient={setSelectedPatient}
                    submitError={submitError}
                    setSubmitError={setSubmitError}
                />
            }
        />
    );
}
