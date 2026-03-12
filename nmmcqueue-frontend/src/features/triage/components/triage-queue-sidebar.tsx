"use client";

import { useTransition } from "react";
import { markNoShow, removeQueue, restoreNoShow } from "../actions";
import { useTriageQueue } from "../hooks";
import { VisitWithPatient } from "../types";
import { CheckCircle, ClockCounterClockwise, Trash, UserMinus } from "@phosphor-icons/react";

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
        <div className="w-[380px] flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden shrink-0 relative">
            {/* Header & Premium Pill Tabs */}
            <div className="bg-white shrink-0 pt-6 px-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-4">Waiting List</h2>
                
                <div className="flex p-1 bg-slate-100/80 rounded-full border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab("ACTIVE")}
                        className={`flex-1 relative flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                            activeTab === "ACTIVE" 
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" 
                                : "text-slate-500 hover:text-emerald-600 bg-transparent"
                        }`}
                    >
                        <span>Active</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] leading-none transition-colors ${
                            activeTab === "ACTIVE" ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                        }`}>
                            {activeQueue.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("NO_SHOW")}
                        className={`flex-1 relative flex justify-center items-center gap-2 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                            activeTab === "NO_SHOW" 
                                ? "bg-slate-800 text-white shadow-md shadow-black/10" 
                                : "text-slate-500 hover:text-slate-800 bg-transparent"
                        }`}
                    >
                        <span>No Show</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] leading-none transition-colors ${
                            activeTab === "NO_SHOW" ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                        }`}>
                            {noShowQueue.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 relative custom-scrollbar">
                {isPending && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="flex flex-col items-center text-emerald-600">
                            <span className="text-sm font-bold animate-pulse bg-white px-5 py-2.5 rounded-xl shadow-lg border border-emerald-100">
                                Updating Queue...
                            </span>
                        </div>
                    </div>
                )}

                {activeTab === "ACTIVE" ? (
                    activeQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center mt-10">
                            <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                            <p className="text-lg font-medium text-slate-500">Queue is empty</p>
                            <p className="text-xs mt-2 text-slate-400">No active patients waiting for triage.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeQueue.map((visit) => {
                                const isSelected = selectedPatientId === visit.id;
                                const isDis = isManualEntry;
                                return (
                                    <div
                                        key={visit.id}
                                        onClick={() => {
                                            if (!isDis) {
                                                onError("");
                                                onSelectPatient(visit);
                                            }
                                        }}
                                        className={`group p-4 rounded-xl border transition-all duration-200 shadow-sm flex flex-col relative overflow-hidden ${
                                            isDis
                                                ? "opacity-50 bg-slate-100 border-slate-200 border-dashed"
                                                : isSelected
                                                    ? "bg-white ring-2 ring-emerald-500 border-transparent shadow-emerald-500/10 z-10 scale-[1.02]"
                                                    : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer"
                                        }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isSelected ? 'bg-emerald-500' : 'bg-transparent group-hover:bg-emerald-200'}`} />
                                        
                                        <div className="pl-2">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-black text-[15px] uppercase tracking-tight leading-tight ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-3">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    Queued at {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className={`flex gap-2 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto group-hover:pt-1 group-focus-within:opacity-100 group-focus-within:h-auto'}`}>
                                                <button
                                                    disabled={isPending}
                                                    onClick={(e) => handleNoShow(visit.id, e)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 rounded-lg text-xs font-bold transition-colors"
                                                    title="Mark as No Show"
                                                >
                                                    <UserMinus size={14} weight="bold" />
                                                    No Show
                                                </button>
                                                <button
                                                    disabled={isPending}
                                                    onClick={(e) => handleRemove(visit.id, e)}
                                                    className="flex-none px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/50 rounded-lg text-xs font-bold transition-colors"
                                                    title="Remove completely"
                                                >
                                                    <Trash size={14} weight="bold" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    noShowQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center mt-10">
                            <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                            <p className="text-lg font-medium text-slate-500">No missed patients</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {noShowQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="p-4 rounded-xl border bg-white border-slate-200 shadow-sm flex flex-col relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-300" />
                                    
                                    <div className="pl-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-600 uppercase tracking-tight text-[15px] opacity-80">
                                                {visit.patient.lastName}, {visit.patient.firstName}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-400 font-medium mb-3 pb-3 border-b border-slate-100">
                                            <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                                                <UserMinus size={12} weight="fill" /> Marked No Show
                                            </span>
                                            <span>
                                                {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => handleRestore(visit.id, e)}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 text-white hover:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                                        >
                                            <ClockCounterClockwise size={14} weight="bold" />
                                            Restore to Active
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
