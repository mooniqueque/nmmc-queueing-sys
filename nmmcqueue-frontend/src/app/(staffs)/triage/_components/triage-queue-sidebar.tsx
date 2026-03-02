"use client";

import { useTransition } from "react";
import { markNoShow, removeQueue, restoreNoShow } from "../_actions/triage-actions";
import { useTriageQueue } from "../_hooks/use-triage-queue";
import { VisitWithPatient } from "../_types";

interface TriageQueueSidebarProps {
    initialQueue: VisitWithPatient[];
    isManualEntry: boolean;
    selectedPatientId: string | undefined;
    onSelectPatient: (patient: VisitWithPatient | null) => void;
    onError: (err: string) => void;
}

export function TriageQueueSidebar({
    initialQueue,
    isManualEntry,
    selectedPatientId,
    onSelectPatient,
    onError
}: TriageQueueSidebarProps) {
    const { activeQueue, noShowQueue, activeTab, setActiveTab } = useTriageQueue(initialQueue);
    const [isPending, startTransition] = useTransition();

    const handleNoShow = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await markNoShow(visitId);
            if (res?.error) onError(res.error);
            if (selectedPatientId === visitId) onSelectPatient(null);
        });
    }

    const handleRestore = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await restoreNoShow(visitId);
            if (res?.error) onError(res.error);
        });
    }

    const handleRemove = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to completely remove this patient from the triage queue?")) return;
        startTransition(async () => {
            const res = await removeQueue(visitId);
            if (res?.error) onError(res.error);
            if (selectedPatientId === visitId) onSelectPatient(null);
        });
    }

    return (
        <div className="w-80 flex flex-col bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden shrink-0">
            <div className="p-4 bg-emerald-900 border-b border-emerald-800 flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white tracking-wide">WAITING FOR TRIAGE</h2>
            </div>

            {/* Tabs */}
            <div className="flex bg-emerald-800 shrink-0">
                <button
                    onClick={() => setActiveTab("ACTIVE")}
                    className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === "ACTIVE" ? "bg-emerald-700 text-white border-b-2 border-emerald-300" : "text-emerald-300 hover:text-white"}`}
                >
                    ACTIVE ({activeQueue.length})
                </button>
                <button
                    onClick={() => setActiveTab("NO_SHOW")}
                    className={`flex-1 py-3 text-xs font-bold transition-colors border-l border-emerald-900 ${activeTab === "NO_SHOW" ? "bg-slate-700 text-white border-b-2 border-slate-300" : "text-emerald-300 hover:text-white"}`}
                >
                    NO SHOW ({noShowQueue.length})
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 pointer-events-auto bg-slate-50 relative">
                {isPending && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-700 animate-pulse bg-white px-4 py-2 rounded-lg shadow-md">Updating Queue...</span>
                    </div>
                )}

                {activeTab === "ACTIVE" ? (
                    activeQueue.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 text-sm font-medium">No active patients in queue.</div>
                    ) : (
                        activeQueue.map((visit) => (
                            <div
                                key={visit.id}
                                onClick={() => {
                                    if (!isManualEntry) {
                                        onError("");
                                        onSelectPatient(visit);
                                    }
                                }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all shadow-sm flex flex-col gap-2 ${isManualEntry
                                    ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                                    : selectedPatientId === visit.id
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
                                    <span>Queued: {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <button
                                        disabled={isPending}
                                        onClick={(e) => handleNoShow(visit.id, e)}
                                        className="flex-1 px-2 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-[10px] font-bold uppercase transition-colors"
                                    >
                                        No Show
                                    </button>
                                    <button
                                        disabled={isPending}
                                        onClick={(e) => handleRemove(visit.id, e)}
                                        className="flex-1 px-2 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[10px] font-bold uppercase transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    noShowQueue.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 text-sm font-medium">No missed patients today.</div>
                    ) : (
                        noShowQueue.map((visit) => (
                            <div
                                key={visit.id}
                                className="p-3 rounded-lg border bg-slate-100 border-slate-300 shadow-sm flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-700 uppercase tracking-tight text-sm">
                                        {visit.patient.lastName}, {visit.patient.firstName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 font-medium pb-1 border-b border-slate-200">
                                    <span className="text-amber-700 font-bold">MARKED NO SHOW</span>
                                    <span>{new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <button
                                    disabled={isPending}
                                    onClick={(e) => handleRestore(visit.id, e)}
                                    className="w-full mt-1 px-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[10px] font-bold uppercase transition-colors"
                                >
                                    Restore to Active Queue
                                </button>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
