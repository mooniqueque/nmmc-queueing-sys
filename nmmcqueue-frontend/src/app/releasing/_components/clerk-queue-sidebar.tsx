"use client";

import { VisitWithPatient } from "@/app/triage/_types";
import { useClerkQueue } from "../_hooks/use-clerk-queue";

interface ClerkQueueSidebarProps {
    initialQueue: VisitWithPatient[];
    selectedPatientId: string | undefined;
    onSelectPatient: (patient: VisitWithPatient | null) => void;
    onError: (err: string) => void;
}

export function ClerkQueueSidebar({
    initialQueue,
    selectedPatientId,
    onSelectPatient,
    onError
}: ClerkQueueSidebarProps) {
    const { activeQueue } = useClerkQueue(initialQueue);

    return (
        <div className="w-80 flex flex-col bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden shrink-0">
            <div className="p-4 bg-emerald-900 border-b border-emerald-800 flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white tracking-wide">WAITING FOR WINDOW</h2>
            </div>
            <div className="flex bg-emerald-800 shrink-0">
                <div
                    className="flex-1 py-3 text-xs font-bold transition-colors bg-emerald-700 text-white border-b-2 border-emerald-300 text-center uppercase"
                >
                    ACTIVE QUEUE ({activeQueue.length})
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 pointer-events-auto bg-slate-50 relative">
                {activeQueue.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 text-sm font-medium">No active patients waiting.</div>
                ) : (
                    activeQueue.map((visit) => (
                        <div
                            key={visit.id}
                            onClick={() => {
                                onError("");
                                onSelectPatient(visit);
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all shadow-sm flex flex-col gap-2 ${selectedPatientId === visit.id
                                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20"
                                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                                    {visit.patient.lastName}, {visit.patient.firstName}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>Ticket: <strong className="text-emerald-700">{visit.ticketNumber}</strong></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
