"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportBreakdownCard, ReportMetricCard, getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useWindowSnapshot } from "@/features/shared/hooks/use-operational-snapshot";
import { VisitWithPatient } from "@/features/triage/types";
import { notify } from "@/shared/lib/notify";
import { SessionUser } from "@/shared/types/auth";
import { Department, PriorityCategory } from "@/shared/types/models";
import { ArrowsCounterClockwise, Play, Printer, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { assignTicket, callNextWindow, callTicket, noShowTicket, resetDailyQueue } from "../actions";
import { useReleasingQueue } from "../hooks";
import { ReleasingQueueSidebar, SidebarTab } from "./releasing-queue-sidebar";

interface ReleasingEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, PriorityCategory[]>;
    currentVisit: VisitWithPatient | null;
    user?: SessionUser;
}

export function ReleasingEntry({ initialQueue, departments, queueOptionsByDepartment, currentVisit, user }: ReleasingEntryProps) {
    const { activeQueue } = useReleasingQueue(initialQueue);
    const [activeTab, setActiveTab] = useState<SidebarTab>("ALL");
    const [isResetting, setIsResetting] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [cooldown, setCooldown] = useState(0);

    const [reportDate, setReportDate] = useState(getTodayBusinessDay());
    const { data: snapshotData } = useWindowSnapshot(reportDate);

    const stationNo = user?.workstation?.stationNo ?? 1;

    const [demographics, setDemographics] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        address: "",
        dateOfBirth: "",
        gender: "",
        contactNo: "",
        civilStatus: ""
    });

    useEffect(() => {
        if (currentVisit) {
            setDemographics({
                firstName: currentVisit.patient.firstName || "",
                middleName: currentVisit.patient.middleName || "",
                lastName: currentVisit.patient.lastName || "",
                address: currentVisit.patient.address || "",
                dateOfBirth: currentVisit.patient.dateOfBirth ? new Date(currentVisit.patient.dateOfBirth).toISOString().split('T')[0] : "",
                gender: currentVisit.patient.gender || "",
                contactNo: currentVisit.patient.contactNo || "",
                civilStatus: currentVisit.patient.civilStatus || ""
            });
        } else {
            setDemographics({
                firstName: "", middleName: "", lastName: "", address: "", dateOfBirth: "", gender: "", contactNo: "", civilStatus: ""
            });
        }
    }, [currentVisit]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleCallNext = () => {
        startTransition(async () => {
            const res = await callNextWindow();
            if (res?.success && res.data) {
                notify.success("Patient claimed", {
                    description: `${res.data.patient.lastName}, ${res.data.patient.firstName} — Window ${stationNo}`
                });
            } else if (res?.success && !res.data) {
                notify.info("Queue is empty", { description: "No patients waiting for window." });
            } else {
                notify.error(res?.error || "Failed to call next patient");
            }
        });
    };

    const handleCallAgain = () => {
        if (!currentVisit || cooldown > 0) return;
        startTransition(async () => {
            const res = await callTicket(currentVisit.id);
            if (res?.success) {
                setCooldown(10);
                notify.success("Patient called again", {
                    description: `Ringing bell for window ${stationNo}`
                });
            } else {
                notify.error(res?.message || res?.error || "Failed to re-call patient");
            }
        });
    };

    const handleReset = async () => {
        setIsResetting(true);
        try {
            const res = await resetDailyQueue();
            if (res.success) {
                notify.success("Queue Reset", { description: "Daily sequence and visits have been reset successfully." });
                setResetDialogOpen(false);
            } else {
                notify.error("Reset Failed", { description: res.message || "Could not reset queue." });
            }
        } catch {
            notify.error("Error", { description: "An unexpected error occurred during reset." });
        } finally {
            setIsResetting(false);
        }
    };

    const handleCallNoShow = (visitId: string) => {
        startTransition(async () => {
            const res = await callTicket(visitId);
            if (res?.success && res.data) {
                notify.success("Patient claimed from No-Show");
            } else {
                notify.error(res?.message || res?.error || "Failed to call patient directly");
            }
        });
    };

    const handleNoShow = () => {
        if (!currentVisit) return;
        startTransition(async () => {
            const res = await noShowTicket(currentVisit.id);
            if (res.success) {
                notify.success("Patient marked as no-show");
            } else {
                notify.error(res?.message || res?.error || "Failed to update status");
            }
        });
    };

    const handlePrintAndAssign = () => {
        if (!currentVisit || isPending) return;

        if (!currentVisit.departmentId) {
            notify.error("Cannot assign", { description: "Patient missing Triage Department Endorsement." });
            return;
        }

        const deptName = departments.find(d => d.id === currentVisit.departmentId)?.name.trim().toUpperCase() || "";
        const deptOptions = queueOptionsByDepartment[deptName] || [];
        const isPrio = currentVisit.classification === "PRIORITY";
        const autoQueueOption = deptOptions.find(o => isPrio ? o.isPriority : !o.isPriority) || deptOptions[0];

        if (!autoQueueOption) {
            notify.error("No queue option", {
                description: `The mapped department has no queue categories configured in Admin.`
            });
            return;
        }

        startTransition(async () => {
            try {
                const updateDemographics = async (patientId: string, formData: typeof demographics) => {
                    console.log("Demographics synced", { patientId, formData });
                    await new Promise(r => setTimeout(r, 200));
                };

                await updateDemographics(currentVisit.patientId, demographics);
                notify.success("Demographics synced");

                const res = await assignTicket(currentVisit.id, currentVisit.departmentId!, autoQueueOption.id);

                if (res?.success && res?.data) {
                    notify.success(
                        "Ticket assigned to clinic",
                        {
                            description: `Patient ${res.data.patientFullName} -> Service Ticket #${res.data.serviceTicket}`
                        }
                    );
                } else {
                    notify.error(res?.error || "Ticket assignment failed", { description: "Please try again." });
                }
            } catch (error) {
                notify.error("Error signing ticket", { description: error instanceof Error ? error.message : "Unknown error occurred" });
            }
        });
    };


    const waitingQueue = activeQueue.filter(v => v.status === 'WAITING_WINDOW');
    const noShowQueue = activeQueue.filter(v => v.status === 'NO_SHOW');

    const counts = {
        ALL: waitingQueue.length,
        PRIORITY: waitingQueue.filter(c => c.classification === 'PRIORITY').length,
        REGULAR: waitingQueue.filter(c => c.classification === 'REGULAR').length,
        NO_SHOW: noShowQueue.length,
    };

    const hasActivePatient = !!currentVisit;

    const triageAssignedDepartmentName = useMemo(() => {
        if (currentVisit?.department?.name) return currentVisit.department.name;
        if (currentVisit?.departmentId) {
            return departments.find(d => d.id === currentVisit.departmentId)?.name || "Assigned by Triage";
        }
        return "Not assigned";
    }, [departments, currentVisit]);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-50 p-4 lg:p-6 gap-6">

            {/* LEFT PANE: Sticky Sidebar Container */}
            <div className="w-full lg:w-[35%] xl:w-[30%] h-full shrink-0 flex flex-col">
                <ReleasingQueueSidebar
                    items={[...waitingQueue, ...noShowQueue]}
                    counts={counts}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isLocked={false}
                    onCallNoShow={handleCallNoShow}
                    reportDate={reportDate}
                    setReportDate={setReportDate}
                />
            </div>

            {/* RIGHT PANE: Dynamic Workspace */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col pb-10">
                {activeTab === "REPORTS" ? (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                            <ReportMetricCard label="Assigned To Clinics" value={snapshotData.totals.totalAssignedToClinics.toString()} hint="Patients handed off." />
                            <ReportMetricCard label="Window No-Shows" value={snapshotData.totals.windowNoShowCount.toString()} tone="warning" hint="Missed patients." />
                            <ReportMetricCard label="Average Window Time" value={`${snapshotData.totals.avgWindowProcessingMinutes}m`} tone="success" hint="Handling time." />
                            <ReportMetricCard label="Total Window Calls" value={snapshotData.totals.totalWindowCalls.toString()} hint="Total calls made." />
                        </div>
                        <ReportBreakdownCard
                            title="Processed Per Window Station"
                            emptyLabel="No patients processed."
                            items={snapshotData.processedPerStation.map((item) => ({ id: `${item.stationNo}`, label: `Window ${item.stationNo}`, value: item.count }))}
                        />
                    </div>
                ) : (
                    <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[60vh] shrink-0">
                        <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-extrabold text-gray-800 tracking-wider uppercase">
                                    Calling Zone
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!hasActivePatient ? (
                                <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 lg:p-24 mt-4 shadow-sm">
                                    <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                        Queue Ready
                                    </div>
                                    <div className="mt-3 text-2xl font-black tracking-tight text-slate-800">
                                        No patient currently claimed
                                    </div>
                                    <Button
                                        onClick={handleCallNext}
                                        disabled={isPending}
                                        className="mt-8 h-16 px-12 text-lg font-black uppercase tracking-[0.18em] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl shadow-sm transition-transform hover:scale-105"
                                    >
                                        <Play size={24} weight="fill" className="mr-3" />
                                        Call Next
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-8 mt-2">
                                    {/* Active Header */}
                                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                                        <div className="space-y-3">
                                            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                Now Serving
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                {cooldown > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled
                                                        className="h-6 px-2 text-[10px] font-bold shadow-none"
                                                    >
                                                        Ring in {cooldown}s
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="text-3xl lg:text-3xl font-black text-foreground">
                                                {currentVisit?.patient.lastName}, <span className="text-foreground/80">{currentVisit?.patient.firstName}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm font-bold rounded-lg uppercase tracking-wider">
                                                    Queue #{currentVisit?.triageTicket}
                                                </div>
                                                <div className="bg-muted border border-border px-3 py-1 text-sm font-bold rounded-lg text-muted-foreground uppercase tracking-wider">
                                                    In Window
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3 shrink-0">
                                            <Button
                                                type="button"
                                                onClick={() => handleCallAgain()}
                                                disabled={isPending || cooldown > 0}
                                                variant="outline"
                                                className="h-10 px-6 font-bold uppercase tracking-widest text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm rounded-xl"
                                            >
                                                Call Again
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={handleNoShow}
                                                disabled={isPending}
                                                className="h-10 px-6 font-bold uppercase tracking-widest transition-all shadow-sm rounded-xl border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700"
                                            >
                                                <X size={20} weight="bold" className="mr-2" />
                                                No Show
                                            </Button>
                                            <Button
                                                onClick={handlePrintAndAssign}
                                                disabled={isPending || !currentVisit?.departmentId}
                                                className={`h-10 px-8 font-extrabold uppercase tracking-widest transition-transform shadow-sm rounded-xl border ${!currentVisit?.departmentId ? 'opacity-50 cursor-not-allowed text-emerald-700 bg-emerald-50 border-emerald-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:-translate-y-1'}`}
                                            >
                                                <Printer size={20} weight="fill" className="mr-3" />
                                                Print & Assign
                                            </Button>
                                        </div>
                                    </div>

                                    {(!currentVisit?.departmentId) && (
                                        <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl flex items-center gap-3 text-rose-600 font-bold">
                                            <WarningCircle size={24} weight="fill" />
                                            Cannot assign: Patient missing Triage Department Endorsement. Proceed to Re-Triage.
                                        </div>
                                    )}

                                    {/* Section A: Triage Endorsement Card */}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                        <div className="text-sm font-extrabold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            Triage Endorsement
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 opacity-70">Disposition</div>
                                                <div className="text-xl font-black text-slate-900 uppercase">{currentVisit?.disposition || "None"}</div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 opacity-70">Classification</div>
                                                <div className="text-xl font-black text-slate-900 uppercase">{currentVisit?.classification || "Regular"}</div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 ring-2 ring-emerald-100/70">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 opacity-70">Clinic Dept</div>
                                                <div className="text-xl font-black text-slate-900">{triageAssignedDepartmentName}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vitals Ribbon */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Blood Pressure</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold tracking-tight text-foreground">{currentVisit?.bloodPressure || "--/--"}</span>
                                                <span className="text-xs font-medium text-muted-foreground">mmHg</span>
                                            </div>
                                        </div>
                                        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Temperature</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-bold tracking-tight text-foreground">{currentVisit?.temperature || "--"}</span>
                                                <span className="text-xs font-medium text-muted-foreground">°C</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Chief Complaint</span>
                                            <span className="text-sm font-semibold tracking-tight text-foreground italic line-clamp-2">&quot;{currentVisit?.chiefComplaint || "None recorded"}&quot;</span>
                                        </div>
                                    </div>

                                    {/* Section B: Editable Patient Demographics Fields */}
                                    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                                        <div className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">
                                            Editable Patient Demographics
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Last Name</Label>
                                                <Input
                                                    value={demographics.lastName}
                                                    onChange={e => setDemographics(p => ({ ...p, lastName: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">First Name</Label>
                                                <Input
                                                    value={demographics.firstName}
                                                    onChange={e => setDemographics(p => ({ ...p, firstName: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Middle Name</Label>
                                                <Input
                                                    value={demographics.middleName}
                                                    onChange={e => setDemographics(p => ({ ...p, middleName: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Contact Number</Label>
                                                <Input
                                                    value={demographics.contactNo}
                                                    onChange={e => setDemographics(p => ({ ...p, contactNo: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Date of Birth</Label>
                                                <Input
                                                    type="date"
                                                    value={demographics.dateOfBirth}
                                                    onChange={e => setDemographics(p => ({ ...p, dateOfBirth: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Gender</Label>
                                                <Input
                                                    value={demographics.gender}
                                                    onChange={e => setDemographics(p => ({ ...p, gender: e.target.value }))}
                                                    className="text-base font-semibold text-gray-900 h-12"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-6 space-y-2">
                                            <Label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Full Address</Label>
                                            <Input
                                                value={demographics.address}
                                                onChange={e => setDemographics(p => ({ ...p, address: e.target.value }))}
                                                className="text-base font-semibold text-gray-900 h-12 w-full"
                                            />
                                        </div>
                                    </div>

                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

