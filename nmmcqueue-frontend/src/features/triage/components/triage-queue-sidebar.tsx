"use client";

import { Button } from "@/components/ui/button";
import { ReportBreakdownCard, ReportDatePicker, ReportMetricCard, getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useTriageSnapshot } from "@/features/shared/hooks/use-operational-snapshot";
import { notify } from "@/shared/lib/notify";
import { calculateAge } from "@/shared/lib/utils";
import { SessionUser } from "@/shared/types/auth";
import { CheckCircle, Clock, Play, Plus, Trash, User } from "@phosphor-icons/react";
import { useEffect, useState, useTransition } from "react";
import { callNextTriage, callSpecificTriage, markNoShow, removeQueue, restoreNoShow } from "../actions";
import { useTriageQueue } from "../hooks";
import { useTriageStore } from "../store/use-triage-store";
import { VisitWithPatient } from "../types";


interface TriageQueueSidebarProps {
    initialQueue: VisitWithPatient[];
    currentVisit: VisitWithPatient | null;
    user?: SessionUser;
}

export function TriageQueueSidebar({
    initialQueue,
    currentVisit: staticCurrentVisit,
    user,
}: TriageQueueSidebarProps) {
    const { selectedPatient, isManualEntry, setSelectedPatient, setSubmitError, setManualEntry } = useTriageStore();
    const selectedPatientId = selectedPatient?.id;
    const onError = setSubmitError;

    // TASK 2 FIX: userId is passed to hook for real-time claim isolation
    const { activeQueue, noShowQueue, claimedVisit, activeTab, setActiveTab } = useTriageQueue(initialQueue, staticCurrentVisit, user?.id);
    
    const [isPending, startTransition] = useTransition();
    const [nowMs, setNowMs] = useState<number | null>(null);
    const [reportDate, setReportDate] = useState(getTodayBusinessDay());
    const { data: snapshotData } = useTriageSnapshot(reportDate);

    // Sync real-time claimedVisit with the store
    useEffect(() => {
        if (claimedVisit) {
            setSelectedPatient(claimedVisit);
        }
    }, [claimedVisit, setSelectedPatient]);

    useEffect(() => {
        const updateNow = () => setNowMs(Date.now());
        updateNow();
        const intervalId = window.setInterval(updateNow, 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    // Check if there's an active claimed patient
    const hasActivePatient = !!claimedVisit || (selectedPatient && !isManualEntry);

    // ─── Call Next (Claim-Based) ────────────────────────────
    const handleCallNext = () => {
        startTransition(async () => {
            const res = await callNextTriage();
            if (res?.success && res.data) {
                // Note: local state will also be updated by SSE shortly, 
                // but setting here for immediate feedback.
                setSelectedPatient(res.data);
                notify.success("Patient claimed", { description: `${res.data.patient.lastName}, ${res.data.patient.firstName}` });
            } else if (res?.success && !res.data) {
                notify.info("Queue is empty", { description: "No patients waiting for triage." });
            } else {
                notify.error(res?.message || res?.error || "Failed to call next patient");
            }
        });
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space") return;
            if (event.repeat) return;

            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            if (isPending || hasActivePatient) return;

            event.preventDefault();
            handleCallNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isPending, hasActivePatient]);

    const handleCallSpecific = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await callSpecificTriage(visitId);
            if (res?.success && res.data) {
                setSelectedPatient(res.data);
                notify.success("Patient specifically claimed");
            } else {
                notify.error(res?.message || res?.error || "Failed to call patient directly");
            }
        });
    };

    const handleNoShow = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await markNoShow(visitId);
            if (res?.error) onError(res.error);
            if (selectedPatientId === visitId) setSelectedPatient(null);
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
            if (selectedPatientId === visitId) setSelectedPatient(null);
        });
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">

            {/* ─── Call Next + Header ─── */}
            <div className="bg-card shrink-0">
                {/* Call Next Button Row */}
                <div className="border-b border-border px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Triage Queue</h2>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                            <strong className="text-primary">{activeQueue.length}</strong> patients waiting
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            onClick={handleCallNext}
                            disabled={isPending || !!hasActivePatient}
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-xl shadow-md hover:shadow-lg transition-all gap-2 disabled:opacity-50"
                        >
                            <Play size={16} weight="fill" />
                            <span className="hidden xs:inline">Call Next Patient</span>
                            <span className="xs:hidden">Call Next</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 sm:h-10 px-3 font-bold border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all gap-2 shrink-0"
                            onClick={() => setManualEntry(true)}
                            disabled={!!hasActivePatient}
                        >
                            <Plus size={14} weight="bold" />
                            <span className="hidden sm:inline">Walk-In</span>
                        </Button>
                    </div>
                </div>

                {/* ─── Current Patient Banner ─── */}
                {claimedVisit && (
                    <div
                        className="border-b-2 border-primary/30 bg-primary/5 px-3 sm:px-6 py-3 flex items-center gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => setSelectedPatient(claimedVisit)}
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary shadow-inner">
                            <User size={20} weight="bold" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">Currently Serving</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                                {claimedVisit.patient.lastName}, {claimedVisit.patient.firstName}
                                {claimedVisit.triageTicket && (
                                    <div className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">
                                        Triage Ticket #{claimedVisit.triageTicket}
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary font-bold text-[10px] sm:text-xs shrink-0 ml-auto"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatient(claimedVisit);
                            }}
                        >
                            Open Form →
                        </Button>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-border px-3 sm:px-6 py-2.5 flex items-center">
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border">
                        <button
                            onClick={() => setActiveTab("ACTIVE")}
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all ${activeTab === "ACTIVE"
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
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all ${activeTab === "NO_SHOW"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <span>No Show</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeTab === "NO_SHOW" ? "bg-destructive text-destructive-foreground" : "bg-border text-muted-foreground"}`}>
                                {noShowQueue.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("REPORTS")}
                            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all ${activeTab === "REPORTS"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <span>Reports</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            {activeTab !== "REPORTS" && (
                <div className={`grid grid-cols-[40px_1fr_70px_60px] sm:grid-cols-[50px_1fr_100px_90px] gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 bg-muted/30 text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 border-b border-border`}>
                    <div>Queue</div>
                    <div>Patient Name</div>
                    <div className="text-right">Actions</div>
                    <div className="text-right">Wait</div>
                </div>
            )}

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
                    activeQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 sm:p-12 text-center">
                            <CheckCircle size={40} className="mb-4 text-muted/30" weight="bold" />
                            <p className="text-sm font-bold text-foreground">Queue Empty</p>
                            <p className="text-[10px] mt-1">No active patients waiting.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {activeQueue.map((visit) => (
                                <PatientRow
                                    key={visit.id}
                                    visit={visit}
                                    isPending={isPending}
                                    nowMs={nowMs}
                                    onRemove={handleRemove}
                                    onNoShow={handleNoShow}
                                />
                            ))}
                        </div>
                    )
                ) : activeTab === "NO_SHOW" ? (
                    noShowQueue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 sm:p-12 text-center">
                            <CheckCircle size={40} className="mb-4 text-muted/30" weight="bold" />
                            <p className="text-sm font-bold text-foreground">No Missed Patients</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {noShowQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="w-full text-left grid grid-cols-[40px_1fr_80px] sm:grid-cols-[60px_1fr_120px] gap-3 sm:gap-6 items-center px-3 sm:px-6 py-3 sm:py-4 border-b border-border bg-card"
                                >
                                    <div className="text-xs sm:text-sm font-bold text-muted-foreground">
                                        {visit.triageTicket ? `Triage #${visit.triageTicket}` : ''}
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <div className="font-bold text-[11px] sm:text-xs truncate text-muted-foreground line-through">
                                            {visit.patient.lastName}, {visit.patient.firstName}
                                        </div>
                                        <div className="text-[8px] sm:text-[9px] font-bold text-muted-foreground/60 mt-0.5 uppercase tracking-widest">
                                            No-Show: {new Date(visit.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            disabled={isPending || !!hasActivePatient}
                                            onClick={(e) => handleCallSpecific(visit.id, e)}
                                            className="h-7 sm:h-8 px-2.5 sm:px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <Play size={10} weight="fill" className="hidden sm:inline-block" /> Call
                                        </button>
                                        <button
                                            disabled={isPending || !!hasActivePatient}
                                            onClick={(e) => handleRestore(visit.id, e)}
                                            className="h-7 sm:h-8 px-2.5 sm:px-4 bg-foreground text-background hover:bg-foreground/90 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50"
                                        >
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === "REPORTS" ? (
                    <div className="flex flex-col gap-4 p-4 sm:p-6">
                        <ReportDatePicker value={reportDate} onChange={setReportDate} />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <ReportMetricCard
                                label="Total Tickets Generated"
                                value={snapshotData.totals.totalTicketsGenerated.toString()}
                                hint="Triage tickets issued on the selected business day."
                            />
                            <ReportMetricCard
                                label="Abandoned Before Window"
                                value={snapshotData.totals.abandonedBeforeWindow.toString()}
                                hint="Marked no-show before ever reaching the window."
                                tone="warning"
                            />
                            <ReportMetricCard
                                label="Priority Tickets"
                                value={snapshotData.totals.priorityCount.toString()}
                                hint="Priority-classified triage tickets."
                                tone="success"
                            />
                            <ReportMetricCard
                                label="Regular Tickets"
                                value={snapshotData.totals.regularCount.toString()}
                                hint="Regular triage tickets."
                            />
                        </div>
                        <ReportBreakdownCard
                            title="Tickets Per Department"
                            emptyLabel="No triage tickets were assigned to departments for this date."
                            items={snapshotData.ticketsPerDepartment.map((item) => ({
                                id: item.departmentId ?? item.departmentName,
                                label: item.departmentName,
                                value: item.count,
                            }))}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function PatientRow({
    visit,
    isPending,
    nowMs,
    onRemove,
    onNoShow
}: {
    visit: VisitWithPatient;
    isPending: boolean;
    nowMs: number | null;
    onRemove: (id: string, e: React.MouseEvent) => void;
    onNoShow: (id: string, e: React.MouseEvent) => void;
}) {
    const createdAtMs = new Date(visit.createdAt).getTime();
    const effectiveNowMs = nowMs ?? createdAtMs;
    const waitMins = Math.max(0, Math.floor((effectiveNowMs - createdAtMs) / 60000));
    const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins}m`;
    const isWaitingLong = waitMins > 10;
    const isWaitingExtreme = waitMins > 30;

    const waitColorClasses = isWaitingExtreme
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : isWaitingLong
            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
            : "bg-muted text-muted-foreground border-border";

    return (
        <div
            className="w-full text-left grid grid-cols-[40px_1fr_70px_60px] sm:grid-cols-[50px_1fr_100px_90px] gap-2 sm:gap-4 items-center px-3 sm:px-6 py-3 sm:py-4 transition-all duration-200 border-b border-border bg-card group"
        >
            {/* Ticket */}
            <div className="flex flex-col gap-0.5 text-primary/70">
                <div className="text-xs sm:text-sm font-bold tracking-tight">
                    {visit.triageTicket ? `Triage #${visit.triageTicket}` : null}
                </div>
                <div className="flex flex-wrap gap-0.5">
                    {visit.categories && visit.categories.length > 0 &&
                        visit.categories.map((vc) => (
                            <span
                                key={vc.categoryId}
                                className={`text-[7px] sm:text-[8px] font-bold px-1 rounded border uppercase tracking-widest ${vc.category?.isPriority
                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                        : "bg-muted text-muted-foreground border-border"
                                    }`}
                            >
                                {vc.category?.code || vc.category?.name?.substring(0, 3)}
                            </span>
                        ))
                    }
                </div>
            </div>

            {/* Name & Demographics */}
            <div className="min-w-0 pr-2 flex flex-col justify-center gap-0.5">
                <div className="flex items-center gap-1.5 font-bold text-[11px] sm:text-xs truncate text-foreground/80">
                    <span>{visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span></span>
                    {visit.kioskRegistrationType && (
                        <span className="hidden sm:inline text-[7px] sm:text-[8px] font-bold tracking-widest px-1 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 leading-none h-fit uppercase mt-0.5">
                            {visit.kioskRegistrationType}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="text-[8px] sm:text-[9px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                        {visit.patient.gender.substring(0, 1)} • {calculateAge(visit.patient.dateOfBirth) ?? '??'}y
                        <span className="hidden sm:inline opacity-40">•</span>
                        <span className="hidden sm:inline italic">{new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    disabled={isPending}
                    onClick={(e) => onRemove(visit.id, e)}
                    className="p-1 sm:p-1.5 hover:bg-destructive/10 text-destructive rounded transition-colors"
                    title="Remove completely"
                >
                    <Trash size={14} weight="bold" />
                </button>
                <button
                    disabled={isPending}
                    onClick={(e) => onNoShow(visit.id, e)}
                    className="p-1 sm:p-1.5 hover:bg-amber-500/10 text-amber-600 rounded transition-colors"
                    title="Mark as No-Show"
                >
                    <User size={14} weight="bold" />
                </button>
            </div>

            {/* Wait Time */}
            <div className="flex items-center justify-end">
                <div className={`flex items-center justify-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border ${waitColorClasses}`}>
                    <Clock size={10} weight="bold" className="hidden sm:block" />
                    {waitStr}
                </div>
            </div>
        </div>
    );
}
