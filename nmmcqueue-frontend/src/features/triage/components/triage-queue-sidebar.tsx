"use client";

import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
import { markNoShow, removeQueue, restoreNoShow } from "../actions";
import { useTriageQueue } from "../hooks";
import { VisitWithPatient } from "../types";
import { useTriageStore } from "../store/use-triage-store";
import { MagnifyingGlass, ArrowClockwise, CheckCircle, UserMinus, Trash, Clock, Plus } from "@phosphor-icons/react";
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
    const { selectedPatient, isManualEntry, isPanelOpen, setSelectedPatient, setSubmitError, setManualEntry } = useTriageStore();
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
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">

            {/* Split Top Header */}
            <div className="bg-card shrink-0">
                {/* Header 1: Title and global search */}
                <div className="border-b border-border flex flex-col xl:flex-row justify-between items-start xl:items-center px-6 py-5 gap-4">
                    <div>
                        <h2 className="text-base font-bold text-foreground tracking-tight">Triage Queue</h2>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                            <strong className="text-primary">{activeQueue.length}</strong> patients waiting
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full xl:w-auto">
                        <div className="relative w-full xl:w-64">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={16} weight="bold" />
                            <Input
                                placeholder="Search patients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 w-full bg-muted/50 border-border text-xs font-bold rounded-md focus-visible:ring-primary/20"
                            />
                        </div>
                        <button className="h-9 w-9 shrink-0 flex items-center justify-center border border-border rounded-md hover:bg-muted text-muted-foreground transition-colors">
                            <ArrowClockwise size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Header 2: Pill Tabs */}
                <div className="border-b border-border px-6 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
                        <button
                            onClick={() => setActiveTab("ACTIVE")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === "ACTIVE"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <span>Active</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeTab === "ACTIVE" ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                                {activeQueue.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("NO_SHOW")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === "NO_SHOW"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <span>No Show</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeTab === "NO_SHOW" ? "bg-destructive text-destructive-foreground" : "bg-border text-muted-foreground"}`}>
                                {noShowQueue.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className={`grid ${isPanelOpen ? "grid-cols-[50px_1fr_100px_90px]" : "grid-cols-[60px_1fr_110px_100px]"} gap-4 px-6 py-3 bg-muted/30 text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 border-b border-border`}>
                <div>Queue</div>
                <div>Patient Name</div>
                <div className="text-right">Actions</div>
                <div className="text-right">Wait</div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto bg-card relative custom-scrollbar">
                {isPending && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary animate-pulse bg-background px-4 py-2 rounded-lg shadow-sm border border-border uppercase tracking-widest">
                            Updating...
                        </span>
                    </div>
                )}

                {activeTab === "ACTIVE" ? (
                    filteredActiveQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center">
                            <CheckCircle size={40} className="mb-4 text-muted/30" weight="bold" />
                            <p className="text-sm font-bold text-foreground">Queue Empty</p>
                            <p className="text-[10px] mt-1 mb-6">No active patients waiting.</p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-4 font-bold border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all gap-2"
                                onClick={() => setManualEntry(true)}
                            >
                                <Plus size={14} weight="bold" />
                                Manual Patient Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* MY STATION SECTION */}
                            {myStationQueue.length > 0 && (
                                <div className="flex flex-col">
                                    <div className="px-6 py-2 bg-muted/20 border-b border-border flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Current Station</span>
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
                                </div>
                            )}

                            {/* OTHER STATIONS SECTION */}
                            {otherStationQueue.length > 0 && (
                                <div className="flex flex-col">
                                    <div className="px-6 py-2 bg-muted/20 border-b border-border flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Other Stations / Overflow</span>
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
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    noShowQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center">
                            <CheckCircle size={40} className="mb-4 text-muted/30" weight="bold" />
                            <p className="text-sm font-bold text-foreground">No Missed Patients</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {noShowQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="w-full text-left grid grid-cols-[60px_1fr_120px] gap-6 items-center px-6 py-4 border-b border-border bg-card"
                                >
                                    <div className="text-sm font-bold text-muted-foreground">
                                        #{visit.ticketNumber.toString().padStart(3, '0')}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <div className="font-bold text-xs truncate text-muted-foreground line-through">
                                            {visit.patient.lastName}, {visit.patient.firstName}
                                        </div>
                                        <div className="text-[9px] font-bold text-muted-foreground/60 mt-0.5 uppercase tracking-widest">
                                            No-Show: {new Date(visit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => handleRestore(visit.id, e)}
                                            className="h-8 px-4 bg-foreground text-background hover:bg-foreground/90 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                                        >
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
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : isWaitingLong
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : "bg-muted text-muted-foreground border-border";

    return (
        <div
            onClick={onSelect}
            className={`w-full text-left grid ${isPanelOpen ? "grid-cols-[50px_1fr_100px_90px]" : "grid-cols-[60px_1fr_110px_100px]"} gap-4 items-center px-6 py-4 transition-all duration-200 cursor-pointer border-b outline-none relative group ${isDis
                    ? "opacity-50 cursor-not-allowed bg-muted/30 border-border"
                    : isSelected
                        ? "bg-primary/5 border-primary/20 z-10 shadow-[inset_3px_0_0_hsl(var(--primary))]"
                        : "bg-card border-border hover:bg-muted/30"
                }`}
        >
            {/* Ticket */}
            <div className={`flex flex-col gap-1 ${isSelected ? 'text-primary' : 'text-primary/70'}`}>
                <div className="text-sm font-bold tracking-tight">
                    #{visit.ticketNumber.toString().padStart(3, '0')}
                </div>
                {visit.categories && visit.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {visit.categories.map((vc) => (
                            <span
                                key={vc.categoryId}
                                className={`text-[8px] font-bold px-1 rounded border uppercase tracking-widest ${vc.category?.isPriority
                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                            >
                                {vc.category?.code || vc.category?.name?.substring(0, 3)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Name & Demographics */}
            <div className="min-w-0 pr-4 flex flex-col justify-center gap-0.5">
                <div className={`font-bold text-xs truncate ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                    {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5 flex-wrap uppercase tracking-wider">
                        {visit.patient.gender.substring(0, 1)} • {calculateAge(visit.patient.dateOfBirth)}y
                        <span className="opacity-40">•</span>
                        <span className="italic">{new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {visit.originStation && (
                        <div className="flex items-center gap-1 px-1 py-0.5 bg-muted text-muted-foreground rounded text-[8px] font-bold uppercase tracking-widest border border-border">
                            {visit.originStation.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {!isDis && (
                <div className={`flex items-center justify-end gap-2 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden lg:group-hover:opacity-100 lg:group-hover:h-auto'}`}>
                    <button
                        disabled={isPending}
                        onClick={(e) => onNoShow(visit.id, e)}
                        className="p-1.5 hover:bg-amber-100 text-amber-600 rounded transition-colors"
                        title="Mark as No Show"
                    >
                        <UserMinus size={14} weight="bold" />
                    </button>
                    <button
                        disabled={isPending}
                        onClick={(e) => onRemove(visit.id, e)}
                        className="p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                        title="Remove completely"
                    >
                        <Trash size={14} weight="bold" />
                    </button>
                </div>
            )}
            {isDis && <div />}

            {/* Wait Time Indicator */}
            <div className="flex items-center justify-end">
                <div className={`flex items-center justify-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${waitColorClasses}`}>
                    <Clock size={10} weight="bold" />
                    {waitStr}
                </div>
            </div>
        </div>
    );
}
