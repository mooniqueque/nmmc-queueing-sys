"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitWithPatient } from "@/features/triage/types";
import { Department, PriorityCategory } from "@/shared/types/models";
import { ArrowsCounterClockwise, Play, WarningCircle, Printer, X } from "@phosphor-icons/react";
import { useState, useTransition, useEffect, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { resetDailyQueue, callNextWindow, callTicket, assignTicket, noShowTicket } from "../actions";
import { useReleasingQueue } from "../hooks";
import { ReleasingQueueSidebar, SidebarTab } from "./releasing-queue-sidebar";
import { SessionUser } from "@/shared/types/auth";
import { ReportBreakdownCard, ReportMetricCard, getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useWindowSnapshot } from "@/features/shared/hooks/use-operational-snapshot";

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
    const isPriorityWindow = stationNo >= 1 && stationNo <= 2;

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
        <div className="min-h-screen w-full bg-background">
            {/* Top Toolbar Action Bar specifically for Reset & Station Info */}
            <div className="bg-card w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between border-b border-border shadow-sm">
                 <div className="flex flex-col shrink-0">
                    <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                        Window Registration
                    </h1>
                    <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                        Station {stationNo} • {isPriorityWindow ? 'Priority' : 'Regular'}
                    </p>
                </div>
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg font-bold text-destructive hover:bg-destructive/5 hover:text-destructive border border-border shrink-0 transition-colors">
                            <ArrowsCounterClockwise size={16} weight="bold" className={isResetting ? "animate-spin" : ""} />
                            <span className="hidden sm:inline ml-1.5">Reset Sequence</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-xl p-6 sm:p-8 border-border shadow-xl">
                        <DialogHeader className="pt-2">
                            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6 mx-auto">
                                <ArrowsCounterClockwise size={24} weight="bold" />
                            </div>
                            <DialogTitle className="text-center text-xl font-bold text-foreground tracking-tight mb-2">Reset Daily Queue?</DialogTitle>
                            <DialogDescription className="text-center text-muted-foreground font-medium text-sm leading-relaxed">
                                This action will reset the ticket sequence to <span className="font-bold text-foreground">1</span> and clear all pending visits.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-8 flex gap-3 sm:justify-center">
                            <Button variant="ghost" onClick={() => setResetDialogOpen(false)} className="flex-1 h-11 rounded-lg font-bold">Cancel</Button>
                            <Button onClick={handleReset} disabled={isResetting} className="flex-1 h-11 rounded-lg font-bold bg-destructive hover:bg-destructive/90 text-white shadow-sm">
                                {isResetting ? "Resetting..." : "Confirm Reset"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-12 min-h-[calc(100vh-65px)]">
                {/* Left Pane: Sticky Sidebar */}
                <aside className="col-span-12 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto border-r border-border bg-card">
                    <div className="p-4 lg:p-6 h-full">
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
                </aside>

                {/* Right Pane: Dynamic Workspace */}
                <main className="col-span-12 lg:col-span-7 xl:col-span-8 flex-1 bg-muted/20 pb-10">
                    {activeTab === "REPORTS" ? (
                        <div className="p-4 lg:p-6">
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
                        <div className="p-4 lg:p-6">
                            <Card className="border-border shadow-sm min-h-[60vh]">
                                <CardHeader className="border-b border-border bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-extrabold text-gray-800 tracking-wider uppercase">
                                            Active Action Zone
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {!hasActivePatient ? (
                                        <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-background/60 p-12 lg:p-24 mt-4">
                                            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                                Queue Ready
                                            </div>
                                            <div className="mt-3 text-2xl font-bold text-foreground">
                                                No patient currently claimed
                                            </div>
                                            <Button
                                                onClick={handleCallNext}
                                                disabled={isPending}
                                                className="mt-8 h-16 px-12 text-lg font-black uppercase tracking-widest bg-green-600 hover:bg-green-700 text-white shadow-lg transition-transform hover:scale-105"
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
                                                    <div className="text-4xl lg:text-5xl font-black text-foreground">
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
                                                        className="h-14 px-6 font-bold uppercase tracking-widest text-primary border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                                                    >
                                                        Call Again
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={handleNoShow}
                                                        disabled={isPending}
                                                        className="h-14 px-6 font-bold uppercase tracking-widest transition-all shadow-sm"
                                                    >
                                                        <X size={20} weight="bold" className="mr-2" />
                                                        No Show
                                                    </Button>
                                                    <Button
                                                        onClick={handlePrintAndAssign}
                                                        disabled={isPending || !currentVisit?.departmentId}
                                                        className={`h-14 px-8 font-extrabold uppercase tracking-widest transition-transform shadow-lg ${!currentVisit?.departmentId ? 'opacity-50 cursor-not-allowed text-primary-foreground/50' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1'}`}
                                                    >
                                                        <Printer size={20} weight="fill" className="mr-3" />
                                                        Print & Assign
                                                    </Button>
                                                </div>
                                            </div>

                                            {(!currentVisit?.departmentId) && (
                                                <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-center gap-3 text-destructive font-bold">
                                                    <WarningCircle size={24} weight="fill" />
                                                    Cannot assign: Patient missing Triage Department Endorsement. Proceed to Re-Triage.
                                                </div>
                                            )}

                                            {/* Section A: Triage Endorsement Card */}
                                            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 shadow-sm">
                                                <div className="text-sm font-extrabold text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    Triage Endorsement
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="bg-white/60 p-4 rounded-xl border border-green-100/50">
                                                        <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1 opacity-70">Disposition</div>
                                                        <div className="text-xl font-black text-green-950 uppercase">{currentVisit?.disposition || "None"}</div>
                                                    </div>
                                                    <div className="bg-white/60 p-4 rounded-xl border border-green-100/50">
                                                        <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1 opacity-70">Classification</div>
                                                        <div className="text-xl font-black text-green-950 uppercase">{currentVisit?.classification || "Regular"}</div>
                                                    </div>
                                                    <div className="bg-white/60 p-4 rounded-xl border border-green-100/50 ring-2 ring-green-200/50">
                                                        <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-1 opacity-70">Clinic Dept</div>
                                                        <div className="text-xl font-black text-green-950">{triageAssignedDepartmentName}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vitals Ribbon */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-muted/30 border border-border p-4 rounded-xl">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Blood Pressure</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-bold tracking-tight text-foreground">{currentVisit?.bloodPressure || "--/--"}</span>
                                                        <span className="text-xs font-medium text-muted-foreground">mmHg</span>
                                                    </div>
                                                </div>
                                                <div className="bg-muted/30 border border-border p-4 rounded-xl">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Temperature</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-bold tracking-tight text-foreground">{currentVisit?.temperature || "--"}</span>
                                                        <span className="text-xs font-medium text-muted-foreground">°C</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 bg-muted/30 border border-border p-4 rounded-xl">
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">Chief Complaint</span>
                                                    <span className="text-sm font-semibold tracking-tight text-foreground italic line-clamp-2">&quot;{currentVisit?.chiefComplaint || "None recorded"}&quot;</span>
                                                </div>
                                            </div>

                                            {/* Section B: Editable Patient Demographics Fields */}
                                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                                <div className="text-sm font-extrabold text-foreground uppercase tracking-widest mb-4 border-b border-border pb-3">
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
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

