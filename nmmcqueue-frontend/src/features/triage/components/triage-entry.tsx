"use client";

import { VisitWithPatient } from "../types";
import { TriageForm } from "./triage-form";
import { TriageQueueSidebar } from "./triage-queue-sidebar";
import { useTriageStore } from "../store/use-triage-store";

interface TriageEntryProps {
    initialQueue: VisitWithPatient[];
}

export function TriageEntry({ initialQueue }: TriageEntryProps) {
    const { isPanelOpen } = useTriageStore();

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50/50 p-6 lg:p-8 gap-6">
            {/* Left Box: Queue Table */}
            <div className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isPanelOpen ? "lg:w-[45%]" : "w-full"}`}>
                <TriageQueueSidebar
                    initialQueue={initialQueue}
                />
            </div>

            {/* Right Box: Floating Assignment Side-Panel */}
            {isPanelOpen && (
                <div className="flex flex-col w-full lg:w-[55%] animate-in slide-in-from-right-8 fade-in duration-500">
                    <TriageForm />
                </div>
            )}
        </div>
    );
}
