"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useTriageSnapshot } from "@/features/shared/hooks/use-operational-snapshot";
import { notify } from "@/shared/lib/notify";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { Play } from "@phosphor-icons/react";
import { Building2, Ticket, UserX, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { callNextTriage, callSpecificTriage, markNoShow } from "../actions";
import { useTriageQueue } from "../hooks";
import { useTriageStore } from "../store/use-triage-store";
import { VisitWithPatient } from "../types";
import { TriageForm } from "./triage-form";
import { TriageQueueSidebar } from "./triage-queue-sidebar";

interface TriageEntryProps {
    initialQueue: VisitWithPatient[];
    currentVisit: VisitWithPatient | null;
    user?: SessionUser;
    availableDepartments?: Department[];
}

export function TriageEntry({ initialQueue, currentVisit, user, availableDepartments = [] }: TriageEntryProps) {
    const { isManualEntry, selectedPatient, setManualEntry, setSelectedPatient } = useTriageStore();
    const { activeQueue, noShowQueue, claimedVisit, activeTab, setActiveTab } = useTriageQueue(initialQueue, currentVisit, user?.id);
    const [isPending, startTransition] = useTransition();
    const [reportDate, setReportDate] = useState(getTodayBusinessDay());
    const [isNoShowDialogOpen, setIsNoShowDialogOpen] = useState(false);
    const { data: snapshotData } = useTriageSnapshot(reportDate);

    const activePatient = useMemo(() => claimedVisit ?? selectedPatient, [claimedVisit, selectedPatient]);
    const showEmptyState = !activePatient && !isManualEntry;
    const showManualEntry = isManualEntry && !activePatient;
    const canCallNext = !isPending && !activePatient;
    const isTabLocked = !!activePatient;

    // Keep store in sync with real-time claimed visit
    useEffect(() => {
        if (claimedVisit) {
            setSelectedPatient(claimedVisit);
        }
    }, [claimedVisit, setSelectedPatient]);

    const handleCallNext = useCallback(() => {
        startTransition(async () => {
            const res = await callNextTriage();
            if (res?.success && res.data) {
                setSelectedPatient(res.data);
                notify.success("Patient claimed", { description: `${res.data.patient.lastName}, ${res.data.patient.firstName}` });
            } else if (res?.success && !res.data) {
                notify.info("Queue is empty", { description: "No patients waiting for triage." });
            } else {
                notify.error(res?.message || res?.error || "Failed to call next patient");
            }
        });
    }, [startTransition, setSelectedPatient]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code !== "Space") return;
            if (event.repeat) return;

            const target = event.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                return;
            }
            if (!canCallNext) return;

            event.preventDefault();
            handleCallNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [canCallNext, handleCallNext]);

    const handleNoShow = () => {
        if (!activePatient) return;

        setIsNoShowDialogOpen(true);
    };

    const handleConfirmNoShow = () => {
        if (!activePatient) return;

        startTransition(async () => {
            const res = await markNoShow(activePatient.id);
            if (res?.error) {
                notify.error(res.error);
                return;
            }
            setSelectedPatient(null);
            setIsNoShowDialogOpen(false);
        });
    };

    const handleCallNoShow = useCallback((visitId: string) => {
        startTransition(async () => {
            const res = await callSpecificTriage(visitId);
            if (res?.success && res.data) {
                setSelectedPatient(res.data);
                notify.success("Patient specifically claimed");
            } else {
                notify.error(res?.message || res?.error || "Failed to call patient directly");
            }
        });
    }, [startTransition, setSelectedPatient]);

    return (
        <div className="min-h-screen w-full bg-background">
            <div className="grid grid-cols-12 min-h-screen">
                {/* Left Pane: Sticky Sidebar */}
                <aside className="col-span-12 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-0 lg:h-screen overflow-visible lg:overflow-y-auto border-r border-border bg-card">
                    <div className="p-3 sm:p-4 lg:p-6">
                        <TriageQueueSidebar
                            activeQueue={activeQueue}
                            noShowQueue={noShowQueue}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isLocked={isTabLocked}
                            onCallNoShow={handleCallNoShow}
                            reportDate={reportDate}
                            setReportDate={setReportDate}
                        />
                    </div>
                </aside>

                {/* Right Pane: Dynamic Workspace */}
                <main className="col-span-12 lg:col-span-7 xl:col-span-8 flex-1 bg-slate-50 pb-10">
                    {activeTab === "REPORTS" ? (
                        <div className="p-3 sm:p-4 lg:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <CardContent className="p-0">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                            <Ticket size={20} />
                                        </div>
                                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Tickets</p>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{snapshotData.totals.totalTicketsGenerated}</p>
                                        <p className="text-sm text-slate-400 mt-1">Total patients processed.</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <CardContent className="p-0">
                                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                                            <Users size={20} />
                                        </div>
                                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Priority vs Regular</p>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{snapshotData.totals.priorityCount} / {snapshotData.totals.regularCount}</p>
                                        <p className="text-sm text-slate-400 mt-1">Ratio of patient types.</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                    <CardContent className="p-0">
                                        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                                            <UserX size={20} />
                                        </div>
                                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Abandoned</p>
                                        <p className="text-4xl font-black text-slate-900 mt-1">{snapshotData.totals.abandonedBeforeWindow}</p>
                                        <p className="text-sm text-slate-400 mt-1">Patients who left before triage.</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                                <CardHeader className="p-0 pb-4">
                                    <CardTitle className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        <Building2 size={14} />
                                        Tickets Per Department
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3">
                                    {snapshotData.ticketsPerDepartment.length === 0 ? (
                                        <p className="text-sm text-slate-400">No triage tickets were assigned to departments for this date.</p>
                                    ) : (
                                        snapshotData.ticketsPerDepartment.map((item) => (
                                            <div key={item.departmentId ?? item.departmentName} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                                <span className="text-sm font-semibold text-slate-700">{item.departmentName}</span>
                                                <span className="text-sm font-black text-slate-900">{item.count}</span>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="p-3 sm:p-4 lg:p-6">
                            <Card className="bg-white rounded-2xl shadow-sm border border-slate-100">
                                <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                                    <CardTitle className="text-lg font-extrabold text-gray-800 tracking-wider uppercase">
                                        Calling Zone
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {showEmptyState ? (
                                        <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                                                <Play size={28} weight="fill" className="text-emerald-300" />
                                            </div>
                                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                                Queue Empty
                                            </div>
                                            <div className="mt-3 text-lg sm:text-xl font-black tracking-tight text-slate-800">
                                                No patient currently claimed
                                            </div>
                                            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                                                <Button
                                                    onClick={handleCallNext}
                                                    disabled={!canCallNext}
                                                    className="h-14 px-8 text-sm font-black uppercase tracking-[0.18em] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl shadow-sm"
                                                >
                                                    <Play size={18} weight="fill" />
                                                    Call Next
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setManualEntry(true)}
                                                    className="h-14 px-8 text-xs font-bold uppercase tracking-widest rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                                                >
                                                    Walk-in / Manual Entry
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-5 sm:px-6 shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    {showManualEntry ? (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manual Entry</div>
                                                            <div className="text-xl sm:text-2xl font-bold text-foreground">Walk-in Patient</div>
                                                            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 rounded-full">
                                                                Walk-In Form
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Now Serving</div>
                                                            <div className="text-2xl sm:text-3xl font-black text-foreground">
                                                                {activePatient?.patient.lastName}, {activePatient?.patient.firstName}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {activePatient?.triageTicket && (
                                                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                                                                        Queue #{activePatient.triageTicket}
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="outline" className="text-slate-500 border-slate-200 rounded-full bg-slate-50">
                                                                    In Triage
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 ml-4 shrink-0 transition-all hover:shadow-md">
                                                        <Switch
                                                            id="manual-entry-toggle"
                                                            checked={isManualEntry}
                                                            onCheckedChange={setManualEntry}
                                                            className="data-[state=checked]:bg-emerald-600 shadow-inner"
                                                        />
                                                        <Label htmlFor="manual-entry-toggle" className="text-sm sm:text-base font-bold text-gray-800 uppercase tracking-wide cursor-pointer select-none">
                                                            Walk-in / Manual Entry
                                                        </Label>
                                                    </div>
                                                </div>

                                                {!showManualEntry && (
                                                    <div className="mt-5 flex flex-wrap gap-3">
                                                        <Button
                                                            onClick={handleCallNext}
                                                            disabled={!canCallNext}
                                                            className="h-11 px-6 font-bold uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl"
                                                        >
                                                            <Play size={16} weight="fill" />
                                                            Call Next
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={handleNoShow}
                                                            className="h-11 px-6 font-bold uppercase tracking-widest rounded-xl border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700"
                                                        >
                                                            No Show
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>

                                            <div id="triage-form" className="scroll-mt-24">
                                                <TriageForm availableDepartments={availableDepartments} />
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Dialog open={isNoShowDialogOpen} onOpenChange={setIsNoShowDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Confirm No Show</DialogTitle>
                                <DialogDescription>
                                    This will remove the patient from the active triage queue.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNoShowDialogOpen(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleConfirmNoShow} disabled={isPending}>
                                    {isPending ? "Updating..." : "Mark No Show"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
}
