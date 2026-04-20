"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ReportBreakdownCard, ReportMetricCard, getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useWindowSnapshot } from "@/features/shared/hooks/use-operational-snapshot";
import { VisitWithPatient } from "@/features/triage/types";
import { notify } from "@/shared/lib/notify";
import { SessionUser } from "@/shared/types/auth";
import { Department, PriorityCategory } from "@/shared/types/models";
import { CaretDown, Play, Printer, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { assignTicket, callNextWindow, callPriorityClass, callTicket, noShowTicket, updatePatientDemographics } from "../actions";
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
    const { activeQueue } = useReleasingQueue(initialQueue, user?.id);
    const [activeTab, setActiveTab] = useState<SidebarTab>("PRIORITY");
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
            // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const handleCallNext = (overrideClassification?: 'PRIORITY' | 'REGULAR') => {
        startTransition(async () => {
            const res = await callNextWindow(overrideClassification);
            if (res?.success && res.data) {
                notify.success(
                    overrideClassification === 'REGULAR' ? "Regular patient claimed" : "Patient claimed",
                    {
                        description: `${res.data.patient.lastName}, ${res.data.patient.firstName} — Window ${stationNo}`
                    }
                );
            } else if (res?.success && !res.data) {
                notify.info(
                    overrideClassification === 'REGULAR' ? "No regular patients waiting" : "Queue is empty",
                    {
                        description: overrideClassification === 'REGULAR'
                            ? "There are no regular patients ready for this window right now."
                            : "No patients waiting for window."
                    }
                );
            } else {
                notify.error(res?.error || "Failed to call next patient");
            }
        });
    };

    const handleCallPriorityClass = (priorityTemplateId: string) => {
        startTransition(async () => {
            const res = await callPriorityClass(priorityTemplateId);
            if (res?.success && res.data) {
                notify.success("Priority patient claimed", {
                    description: `${res.data.patient.lastName}, ${res.data.patient.firstName} — Window ${stationNo}`
                });
            } else if (res?.success && !res.data) {
                notify.info("No matching priority patients", {
                    description: "There are no patients waiting for that priority class."
                });
            } else {
                notify.error(res?.error || "Failed to call priority class");
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
                const demographicsResult = await updatePatientDemographics(currentVisit.id, {
                    firstName: demographics.firstName,
                    middleName: demographics.middleName || undefined,
                    lastName: demographics.lastName,
                    address: demographics.address || undefined,
                    dateOfBirth: demographics.dateOfBirth,
                    gender: demographics.gender,
                    contactNo: demographics.contactNo || undefined,
                    civilStatus: demographics.civilStatus || undefined,
                    birthPlace: currentVisit.patient.birthPlace || undefined,
                    religion: currentVisit.patient.religion || undefined,
                });

                if (!demographicsResult?.success) {
                    notify.error("Failed to save patient updates", {
                        description: demographicsResult?.error || "Please review demographics and try again.",
                    });
                    return;
                }

                notify.success("Patient details updated");

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
    const noShowQueue = activeQueue.filter(v => v.status === 'NO_SHOW' && Boolean(v.sequenceKey?.startsWith('WINDOW_')));
    const priorityQueue = waitingQueue.filter(v => v.classification === 'PRIORITY');
    const regularQueue = waitingQueue.filter(v => v.classification === 'REGULAR');

    const sortByCreatedAt = (left: VisitWithPatient, right: VisitWithPatient) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

    const sortedPriorityQueue = useMemo(() => [...priorityQueue].sort(sortByCreatedAt), [priorityQueue]);
    const sortedRegularQueue = useMemo(() => [...regularQueue].sort(sortByCreatedAt), [regularQueue]);
    const sortedNoShowQueue = useMemo(() => [...noShowQueue].sort(sortByCreatedAt), [noShowQueue]);

    const counts = {
        PRIORITY: sortedPriorityQueue.length,
        REGULAR: sortedRegularQueue.length,
        NO_SHOW: sortedNoShowQueue.length,
    };
    const priorityClassOptions = useMemo(() => {
        const byKey = new Map<string, PriorityCategory>();
        const buildKey = (category: PriorityCategory) => {
            if (category.templateId) return `TEMPLATE:${category.templateId}`;
            const code = category.code?.trim().toUpperCase();
            if (code) return `CODE:${code}`;
            return `NAME:${category.name.trim().toUpperCase()}`;
        };

        for (const list of Object.values(queueOptionsByDepartment)) {
            for (const option of list) {
                if (!option.isPriority) continue;
                const key = buildKey(option);
                if (!byKey.has(key)) byKey.set(key, option);
            }
        }
        if (byKey.size === 0) {
            for (const visit of sortedPriorityQueue) {
                for (const entry of visit.categories ?? []) {
                    const category = entry.category;
                    if (category?.isPriority) {
                        const key = buildKey(category);
                        if (!byKey.has(key)) {
                            byKey.set(key, category);
                        }
                    }
                }
            }
        }
        return Array.from(byKey.values()).sort((a, b) => {
            const aOrder = a.template?.sortOrder ?? Number.POSITIVE_INFINITY;
            const bOrder = b.template?.sortOrder ?? Number.POSITIVE_INFINITY;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return a.name.localeCompare(b.name);
        });
    }, [queueOptionsByDepartment, sortedPriorityQueue]);

    const hasActivePatient = !!currentVisit;

    const activeClassCode = useMemo(() => {
        if (!currentVisit) return "REG";

        const explicitCode = currentVisit.categories
            ?.map((entry) => entry.category?.code)
            .find((code): code is string => Boolean(code && code.trim().length > 0));

        if (explicitCode) return explicitCode.trim().toUpperCase();
        return currentVisit.classification === "PRIORITY" ? "PRIO" : "REG";
    }, [currentVisit]);

    const activeQueueCode = useMemo(() => {
        if (!currentVisit) return "REG-";
        return currentVisit.triageTicket != null
            ? `${activeClassCode}-${currentVisit.triageTicket}`
            : `${activeClassCode}-`;
    }, [activeClassCode, currentVisit]);

    const activeClassificationLabel = useMemo(() => {
        if (!currentVisit) return "REGULAR";
        const fallback = currentVisit.classification === "PRIORITY" ? "PRIORITY" : "REGULAR";
        return `${activeClassCode}: ${fallback}`;
    }, [activeClassCode, currentVisit]);

    const triageAssignedDepartmentName = useMemo(() => {
        if (currentVisit?.department?.name) return currentVisit.department.name;
        if (currentVisit?.departmentId) {
            return departments.find(d => d.id === currentVisit.departmentId)?.name || "Assigned by Triage";
        }
        return "Not assigned";
    }, [departments, currentVisit]);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-50/60 p-2 sm:p-3 lg:p-6 gap-3 md:gap-4 lg:gap-5">

            {/* LEFT PANE: Sticky Sidebar Container */}
            <div className="w-full lg:w-[35%] xl:w-[30%] shrink-0 flex flex-col min-h-0">
                <ReleasingQueueSidebar
                    priorityItems={sortedPriorityQueue}
                    regularItems={sortedRegularQueue}
                    noShowItems={sortedNoShowQueue}
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
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col pb-10">
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
                    <Card className="bg-card rounded-2xl border border-border shrink-0 min-h-[60vh] overflow-hidden">
                        <CardHeader className="border-b border-border bg-muted/30 px-6 py-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl font-semibold text-foreground tracking-tight">
                                    Calling Zone
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!hasActivePatient ? (
                                <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 lg:p-20 mt-4 shadow-sm">
                                    <div className="text-sm font-semibold text-muted-foreground">
                                        Queue Ready
                                    </div>
                                    <div className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">
                                        No patient currently claimed
                                    </div>
                                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                                        <div className="flex items-center">
                                            <Button
                                                onClick={() => handleCallNext('PRIORITY')}
                                                disabled={isPending}
                                                className="h-14 px-10 text-lg font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-l-xl rounded-r-none shadow-sm"
                                            >
                                                <Play size={24} weight="fill" className="mr-3" />
                                                Call Priority
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        disabled={isPending || priorityClassOptions.length === 0}
                                                        className="h-14 px-4 border-emerald-200 text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100 rounded-r-xl rounded-l-none"
                                                    >
                                                        <CaretDown size={18} weight="bold" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    {priorityClassOptions.length === 0 ? (
                                                        <DropdownMenuItem disabled>
                                                            No priority classes
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        priorityClassOptions.map((option) => (
                                                            <DropdownMenuItem
                                                                key={option.templateId || option.code?.trim().toUpperCase() || option.name.trim().toUpperCase()}
                                                                onClick={() => handleCallPriorityClass(option.templateId || option.code?.trim() || option.name.trim())}
                                                            >
                                                                {option.name}
                                                            </DropdownMenuItem>
                                                        ))
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleCallNext('REGULAR')}
                                            disabled={isPending}
                                            className="h-14 px-10 text-lg font-semibold border-sky-200 text-sky-700 bg-sky-50/70 hover:bg-sky-100 rounded-xl shadow-sm"
                                        >
                                            Call Regular
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 mt-2">
                                    {/* Active Header */}
                                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
                                        <div className="space-y-3">
                                            <div className="text-base font-semibold text-muted-foreground flex items-center gap-2">
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
                                            <div className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">
                                                {currentVisit?.patient.lastName}, <span className="text-foreground/80">{currentVisit?.patient.firstName}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="bg-primary/10 text-primary border border-primary/20 px-5 py-2 text-xl lg:text-2xl font-black tracking-wide rounded-xl">
                                                    {activeQueueCode}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 shrink-0">
                                            <Button
                                                type="button"
                                                onClick={() => handleCallAgain()}
                                                disabled={isPending || cooldown > 0}
                                                variant="outline"
                                                className="h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all shadow-sm rounded-xl"
                                            >
                                                Call Again
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={handleNoShow}
                                                disabled={isPending}
                                                className="h-10 sm:h-11 px-3 sm:px-6 text-sm sm:text-base font-semibold transition-all shadow-sm rounded-xl border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700"
                                            >
                                                <X size={18} weight="bold" className="mr-2" />
                                                No Show
                                            </Button>
                                            <Button
                                                onClick={handlePrintAndAssign}
                                                disabled={isPending || !currentVisit?.departmentId}
                                                className={`h-10 sm:h-11 px-3 sm:px-8 text-sm sm:text-base font-semibold transition-all shadow-sm rounded-xl border ${!currentVisit?.departmentId ? 'opacity-50 cursor-not-allowed text-emerald-700 bg-emerald-50 border-emerald-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                                            >
                                                <Printer size={18} weight="fill" className="mr-2" />
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

                                    <Card className="rounded-2xl border border-slate-100 shadow-sm">
                                        <CardContent className="p-6 space-y-6">
                                            <div>
                                                <div className="text-sm md:text-base lg:text-lg font-semibold text-emerald-700 mb-4">
                                                    Triage Endorsement
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                                    <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                                                        <div className="text-xs md:text-sm font-semibold text-slate-600 mb-1">Disposition</div>
                                                        <div className="text-lg md:text-xl font-semibold text-slate-900">{currentVisit?.disposition || "None"}</div>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                                                        <div className="text-xs md:text-sm font-semibold text-slate-600 mb-1">Classification</div>
                                                        <div className="text-lg md:text-xl font-semibold text-slate-900">{activeClassificationLabel}</div>
                                                    </div>
                                                    <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 ring-1 ring-emerald-100/70">
                                                        <div className="text-xs md:text-sm font-semibold text-slate-600 mb-1">Clinic Department</div>
                                                        <div className="text-lg md:text-xl font-semibold text-slate-900">{triageAssignedDepartmentName}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                                <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                                                    <span className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 block">Blood Pressure</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{currentVisit?.bloodPressure || "--/--"}</span>
                                                        <span className="text-xs md:text-sm text-muted-foreground">mmHg</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                                                    <span className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 block">Temperature</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">{currentVisit?.temperature || "--"}</span>
                                                        <span className="text-xs md:text-sm text-muted-foreground">°C</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 md:col-span-2 lg:col-span-1">
                                                    <span className="text-xs md:text-sm font-semibold text-muted-foreground mb-1 block">Chief Complaint</span>
                                                    <span className="text-sm md:text-base font-medium text-foreground line-clamp-2">{currentVisit?.chiefComplaint || "None recorded"}</span>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div>
                                                <div className="text-sm md:text-base lg:text-lg font-semibold text-slate-800 mb-4">
                                                    Editable Patient Demographics
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Last Name</Label>
                                                <Input
                                                    value={demographics.lastName}
                                                    onChange={e => setDemographics(p => ({ ...p, lastName: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">First Name</Label>
                                                <Input
                                                    value={demographics.firstName}
                                                    onChange={e => setDemographics(p => ({ ...p, firstName: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Middle Name</Label>
                                                <Input
                                                    value={demographics.middleName}
                                                    onChange={e => setDemographics(p => ({ ...p, middleName: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Contact Number</Label>
                                                <Input
                                                    value={demographics.contactNo}
                                                    onChange={e => setDemographics(p => ({ ...p, contactNo: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Date of Birth</Label>
                                                <Input
                                                    type="date"
                                                    value={demographics.dateOfBirth}
                                                    onChange={e => setDemographics(p => ({ ...p, dateOfBirth: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Gender</Label>
                                                <Input
                                                    value={demographics.gender}
                                                    onChange={e => setDemographics(p => ({ ...p, gender: e.target.value }))}
                                                    className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 md:mt-6 space-y-2">
                                            <Label className="text-xs md:text-sm lg:text-base font-semibold text-gray-700">Full Address</Label>
                                            <Input
                                                value={demographics.address}
                                                onChange={e => setDemographics(p => ({ ...p, address: e.target.value }))}
                                                className="text-sm md:text-base font-semibold text-gray-900 h-10 md:h-12 w-full"
                                            />
                                        </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

