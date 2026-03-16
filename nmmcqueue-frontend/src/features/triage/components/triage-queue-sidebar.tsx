"use client";

import { useTransition, useState } from "react";
import { markNoShow, removeQueue, restoreNoShow } from "../actions";
import { useTriageQueue } from "../hooks";
import { VisitWithPatient } from "../types";
import { useTriageStore } from "../store/use-triage-store";
import { CheckCircle, Clock, ClockCounterClockwise, Trash, UserMinus, MagnifyingGlass, ArrowClockwise, Desktop } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { calculateAge } from "@/lib/utils";

import { SessionUser } from "@/types/auth";

interface TriageQueueSidebarProps {
    initialQueue: VisitWithPatient[];
    user?: SessionUser;
}

export function TriageQueueSidebar({
    initialQueue,
    user
}: TriageQueueSidebarProps) {
    const { selectedPatient, isManualEntry, isPanelOpen, setSelectedPatient, setSubmitError } = useTriageStore();
    const selectedPatientId = selectedPatient?.id;
    const onSelectPatient = setSelectedPatient;
    const onError = setSubmitError;

    const { activeQueue, noShowQueue, activeTab, setActiveTab } = useTriageQueue(initialQueue);
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");

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

    // Filter active queue by search
    const filteredActiveQueue = activeQueue.filter(v => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            v.ticketNumber.toString().includes(q) ||
            v.patient.firstName.toLowerCase().includes(q) ||
            v.patient.lastName.toLowerCase().includes(q)
        );
    });

    const myStationId = user?.workstationId;
    const pairedStationId = user?.workstation?.pairedStationId;

    const myStationQueue = filteredActiveQueue.filter(v =>
        (pairedStationId && v.originStationId === pairedStationId) ||
        (!pairedStationId && v.originStationId === myStationId)
    );

    const otherStationQueue = filteredActiveQueue.filter(v =>
        (pairedStationId && v.originStationId !== pairedStationId) ||
        (!pairedStationId && v.originStationId !== myStationId)
    );

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">

            {/* Split Top Header - Matches Releasing closely */}
            <div className="bg-white shrink-0">
                {/* Header 1: Title and global search */}
                <div className="border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center px-6 lg:px-8 py-5 gap-4">
                    <div>
                        <h2 className="text-m font-bold text-slate-900 uppercase tracking-tight">Pending Triage Queue</h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Currently <strong className="text-emerald-600 mx-1">{activeQueue.length}</strong> patients waiting
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        <div className="relative w-full xl:w-72">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} weight="bold" />
                            <Input
                                placeholder="Search by patient name or ticket no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 w-full bg-slate-50/50 border-slate-200 text-[13px] font-semibold rounded-sm focus-visible:ring-emerald-500"
                            />
                        </div>
                        <button className="h-10 w-10 shrink-0 flex items-center justify-center border border-slate-200 rounded-sm hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
                            <ArrowClockwise size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Header 2: Pill Tabs */}
                <div className="border-b border-slate-100 px-6 lg:px-8 py-3 flex gap-2">
                    <div className="flex p-1 bg-slate-100/80 rounded-sm border border-slate-200/50">
                        <button
                            onClick={() => setActiveTab("ACTIVE")}
                            className={`relative flex items-center gap-2 px-4 py-1.5 text-[13px] font-bold rounded-sm transition-all duration-300 ${activeTab === "ACTIVE"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                : "text-slate-500 hover:text-emerald-600 bg-transparent"
                                }`}
                        >
                            <span>Active</span>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[10px] leading-none transition-colors ${activeTab === "ACTIVE" ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                                }`}>
                                {activeQueue.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("NO_SHOW")}
                            className={`relative flex items-center gap-2 px-4 py-1.5 text-[13px] font-bold rounded-sm transition-all duration-300 ${activeTab === "NO_SHOW"
                                ? "bg-slate-500 text-white shadow-md shadow-black/10"
                                : "text-slate-500 hover:text-slate-800 bg-transparent"
                                }`}
                        >
                            <span>No Show</span>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[10px] leading-none transition-colors ${activeTab === "NO_SHOW" ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                                }`}>
                                {noShowQueue.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className={`grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px_100px]" : "grid-cols-[70px_1fr_120px_120px]"} gap-6 px-6 lg:px-8 py-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 border-b border-slate-100`}>
                <div>#Queue</div>
                <div>Patient Name</div>
                <div className="text-right">Actions</div>
                <div className="text-right">Wait Time</div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar">
                {isPending && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600 animate-pulse bg-white px-5 py-2.5 rounded-sm
                         shadow-lg border border-emerald-100">
                            Updating Queue...
                        </span>
                    </div>
                )}

                {activeTab === "ACTIVE" ? (
                    filteredActiveQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                            <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                            <p className="text-lg font-medium">Queue is empty</p>
                            <p className="text-xs mt-2 text-slate-500">No active patients waiting for triage.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* MY STATION SECTION */}
                            {myStationQueue.length > 0 && (
                                <>
                                    <div className="px-6 lg:px-8 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Station</span>
                                    </div>
                                    {myStationQueue.map((visit) => (
                                        <PatientRow
                                            key={visit.id}
                                            visit={visit}
                                            isSelected={selectedPatientId === visit.id}
                                            isPending={isPending}
                                            isDis={isManualEntry}
                                            isPanelOpen={isPanelOpen}
                                            onSelect={() => {
                                                if (!isManualEntry) {
                                                    setSubmitError("");
                                                    setSelectedPatient(visit);
                                                }
                                            }}
                                            onNoShow={handleNoShow}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </>
                            )}

                            {/* OTHER STATIONS SECTION */}
                            {otherStationQueue.length > 0 && (
                                <>
                                    <div className="px-6 lg:px-8 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Other Stations / Overflow</span>
                                    </div>
                                    {otherStationQueue.map((visit) => (
                                        <PatientRow
                                            key={visit.id}
                                            visit={visit}
                                            isSelected={selectedPatientId === visit.id}
                                            isPending={isPending}
                                            isDis={isManualEntry}
                                            isPanelOpen={isPanelOpen}
                                            onSelect={() => {
                                                if (!isManualEntry) {
                                                    setSubmitError("");
                                                    setSelectedPatient(visit);
                                                }
                                            }}
                                            onNoShow={handleNoShow}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    )
                ) : (
                    noShowQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12 text-center">
                            <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                            <p className="text-lg font-medium">No missed patients</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {noShowQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="w-full text-left grid grid-cols-[70px_1fr_180px] gap-6 items-center px-6 lg:px-8 py-4 min-h-[72px] border-b border-slate-100 bg-white"
                                >
                                    <div className="text-[15px] font-black text-slate-400">
                                        #{visit.ticketNumber.toString().padStart(3, '0')}
                                    </div>
                                    <div className="min-w-0 pr-4 flex flex-col justify-center">
                                        <div className="font-black text-[14px] leading-tight truncate text-slate-500 line-through">
                                            {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">
                                            Marked No-Show at {new Date(visit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => handleRestore(visit.id, e)}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                                        >
                                            <ClockCounterClockwise size={14} weight="bold" />
                                            Restore
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

function PatientRow({
    visit,
    isSelected,
    isPending,
    isDis,
    isPanelOpen,
    onSelect,
    onNoShow,
    onRemove
}: {
    visit: VisitWithPatient;
    isSelected: boolean;
    isPending: boolean;
    isDis: boolean;
    isPanelOpen: boolean;
    onSelect: () => void;
    onNoShow: (id: string, e: React.MouseEvent) => void;
    onRemove: (id: string, e: React.MouseEvent) => void;
}) {
    // Wait time calc
    const waitMins = Math.floor((new Date().getTime() - new Date(visit.createdAt).getTime()) / 60000);
    const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins} mins`;
    const isWaitingLong = waitMins > 10;
    const isWaitingExtreme = waitMins > 30;

    const waitColorClasses = isWaitingExtreme
        ? "bg-red-100/80 text-red-600 border border-red-200 shadow-sm"
        : isWaitingLong
            ? "bg-amber-100/80 text-amber-700 border border-amber-200 shadow-sm"
            : "bg-slate-100 text-slate-500 border border-slate-200/50";

    return (
        <div
            onClick={onSelect}
            className={`w-full text-left grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px_100px]" : "grid-cols-[70px_1fr_120px_120px]"} gap-6 items-center px-6 lg:px-8 py-4 transition-all duration-200 cursor-pointer min-h-[72px] border-b outline-none relative hover:-translate-y-px group ${isDis
                    ? "opacity-50 hover:translate-y-0 cursor-not-allowed bg-slate-50/50 border-slate-200"
                    : isSelected
                        ? "bg-emerald-50/40 border-emerald-200 z-10 hover:bg-emerald-50 shadow-[inset_4px_0_0_#10b981]"
                        : "bg-white border-slate-100 hover:shadow-md hover:z-10 hover:border-slate-200"
                }`}
        >
            {/* Ticket */}
            <div className={`flex flex-col gap-1 ${isSelected ? 'text-emerald-600' : 'text-emerald-500/80'}`}>
                <div className="text-[15px] font-black transition-colors">
                    #{visit.ticketNumber.toString().padStart(3, '0')}
                </div>
                {visit.categories && visit.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {visit.categories.map((vc) => (
                            <span
                                key={vc.categoryId}
                                className={`text-[8px] font-black px-1 rounded border uppercase tracking-tighter ${vc.category?.isPriority
                                        ? "bg-red-50 text-red-600 border-red-200"
                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}
                            >
                                {vc.category?.code || vc.category?.name?.substring(0, 3)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Name & Demographics */}
            <div className="min-w-0 pr-4 flex flex-col justify-center gap-1">
                <div className={`font-black text-[14px] leading-tight truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 flex-wrap">
                        {visit.patient.gender.substring(0, 1)}, {calculateAge(visit.patient.dateOfBirth)}y
                        <span className="opacity-50 mx-0.5">•</span>
                        <span className="italic">Queued: {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {visit.originStation && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200">
                            <Desktop size={10} weight="bold" />
                            {visit.originStation.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons (Hover to reveal, unless disabled) */}
            {!isDis && (
                <div className={`flex items-center justify-end gap-2 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto group-focus-within:opacity-100 group-focus-within:h-auto'}`}>
                    <button
                        disabled={isPending}
                        onClick={(e) => onNoShow(visit.id, e)}
                        className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200/50 rounded-lg transition-colors"
                        title="Mark as No Show"
                    >
                        <UserMinus size={16} weight="bold" />
                    </button>
                    <button
                        disabled={isPending}
                        onClick={(e) => onRemove(visit.id, e)}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/50 rounded-lg transition-colors"
                        title="Remove completely"
                    >
                        <Trash size={16} weight="bold" />
                    </button>
                </div>
            )}
            {isDis && <div />}

            {/* Wait Time Indicator */}
            <div className="flex items-center justify-end">
                <div className={`flex items-center justify-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] w-full max-w-[90px] ${waitColorClasses}`}>
                    <Clock size={12} weight="bold" className="shrink-0" />
                    {waitStr}
                </div>
            </div>
        </div>
    );
}
