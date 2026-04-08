"use client";

import { SessionUser } from "@/shared/types/auth";
import { useEffect } from "react";
import { useTriageStore } from "../store/use-triage-store";
import { VisitWithPatient } from "../types";
import { TriageForm } from "./triage-form";
import { TriageQueueSidebar } from "./triage-queue-sidebar";

interface TriageEntryProps {
    initialQueue: VisitWithPatient[];
    currentVisit: VisitWithPatient | null;
    user?: SessionUser;
}

export function TriageEntry({ initialQueue, currentVisit, user }: TriageEntryProps) {
    const { isManualEntry, selectedPatient, setSelectedPatient } = useTriageStore();
    const showForm = isManualEntry || !!selectedPatient;

    // Auto-select the claimed patient on mount
    useEffect(() => {
        if (currentVisit) {
            setSelectedPatient(currentVisit);
        }
    }, [currentVisit, setSelectedPatient]);

    return (
        <div className="flex flex-col lg:flex-row items-start min-h-[calc(100vh-80px)] w-full bg-background p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6">
            {/* Left Box: Queue + Call Next */}
            <div
                className={`flex flex-col w-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] z-10 ${showForm ? "lg:w-[40%] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]" : "lg:w-full"}`}
            >
                <TriageQueueSidebar
                    initialQueue={initialQueue}
                    currentVisit={currentVisit}
                    user={user}
                />
            </div>

            {/* Right Box: Triage Form */}
            {showForm && (
                <div className="flex flex-col w-full lg:w-[60%] animate-in slide-in-from-right-8 fade-in duration-500">
                    <TriageForm />
                </div>
            )}
        </div>
    );
}
