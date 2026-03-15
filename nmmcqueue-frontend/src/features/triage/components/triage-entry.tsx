"use client";

import { useState } from "react";
import { VisitWithPatient } from "../types";
import { TriageForm } from "./triage-form";
import { TriageQueueSidebar } from "./triage-queue-sidebar";

interface TriageEntryProps {
    initialQueue: VisitWithPatient[];
}

export function TriageEntry({ initialQueue }: TriageEntryProps) {
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
    const [submitError, setSubmitError] = useState("");

    const isPanelOpen = !!selectedPatient || isManualEntry;

    return (
        <div className="flex flex-col lg:flex-row items-start min-h-[calc(100vh-80px)] w-full bg-slate-50/50 p-6 lg:p-8 gap-6">
            {/* Left Box: Queue Table */}
            <div className={`flex flex-col sticky top-24 h-[calc(100vh-8rem)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-10 ${isPanelOpen ? "lg:w-[45%]" : "w-full"}`}>
                <TriageQueueSidebar
                    initialQueue={initialQueue}
                    isManualEntry={isManualEntry}
                    selectedPatientId={selectedPatient?.id}
                    onSelectPatient={setSelectedPatient}
                    onError={setSubmitError}
                    isPanelOpen={isPanelOpen}
                />
            </div>

            {/* Right Box: Floating Assignment Side-Panel */}
            {isPanelOpen && (
                <div className="flex flex-col w-full lg:w-[55%] animate-in slide-in-from-right-8 fade-in duration-500">
                    <TriageForm
                        isManualEntry={isManualEntry}
                        setIsManualEntry={setIsManualEntry}
                        selectedPatient={selectedPatient}
                        setSelectedPatient={setSelectedPatient}
                        submitError={submitError}
                        setSubmitError={setSubmitError}
                    />
                </div>
            )}
        </div>
    );
}
