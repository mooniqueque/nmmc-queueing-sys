"use client";

import { useClinicQueue } from "@/app/(admin)/_hooks/use-clinic-queue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getDepartments, getQueueOptions } from "@/features/shared/api";
import {
    ReportBreakdownCard,
    ReportDatePicker,
    ReportMetricCard,
    getTodayBusinessDay,
} from "@/features/shared/components/operational-report-panel";
import { useClinicSnapshot } from "@/features/shared/hooks/use-operational-snapshot";
import { VisitWithPatient } from "@/features/triage/types";
import { ApiClientError } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { calculateAge } from "@/shared/lib/utils";
import { PriorityCategory } from "@/shared/types/models";
import {
    ArrowSquareOut,
    ArrowUpRight,
    CaretDown,
    CheckCircle,
    Clock,
    Heartbeat,
    Info,
    Phone,
    SpeakerHigh,
    Thermometer,
    UserMinus,
    Users,
} from "@phosphor-icons/react";
import { BarChart2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { callNextPatient, callPatient, noShowPatient, servePatient, transferPatient } from "../api";
import { useCallerStore } from "../store/use-caller-store";

function getVisitQueueTag(visit: VisitWithPatient) {
    const explicitTag = visit.categories
        ?.map((entry) => entry.category?.code?.trim() || entry.category?.name?.trim() || "")
        .find((value) => value.length > 0);

    if (explicitTag) {
        return explicitTag.toUpperCase();
    }

    if (visit.isReferred) {
        return "REFERRAL";
    }

    return (visit.classification || "REGULAR").toUpperCase();
}

function getPriorityOptionLabel(option: PriorityCategory) {
    const code = option.code?.trim().toUpperCase();
    const name = option.name?.trim();

    if (code && name && code !== name.toUpperCase()) {
        return `${code} - ${name}`;
    }

    return code || name || "Priority";
}

export default function UserCallerDashboard({
    department,
    callerUserId,
    initialQueue = [],
    initialReportDate,
}: {
    department: string;
    callerUserId: string;
    initialQueue?: VisitWithPatient[];
    initialReportDate?: string;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [callAgainCooldown, setCallAgainCooldown] = useState(0);
    const [localClaimedVisit, setLocalClaimedVisit] = useState<VisitWithPatient | null>(null);
    const [optimisticVisits, setOptimisticVisits] = useState<Record<string, VisitWithPatient>>({});
    const [departmentQueueOptions, setDepartmentQueueOptions] = useState<PriorityCategory[]>([]);
    const [nowMs, setNowMs] = useState<number | null>(null);
    const [reportDate, setReportDate] = useState(initialReportDate ?? getTodayBusinessDay());
    const {
        activeTab, setActiveTab,
        allDepartments, setDepartments,
        isReferralModalOpen, setReferralModalOpen,
        targetDeptId, setTargetDeptId,
        resetReferral,
    } = useCallerStore();

    useEffect(() => {
        getDepartments().then((res) => {
            if (res.success) {
                setDepartments(res.data ?? []);
            }
        });
    }, [setDepartments]);

    useEffect(() => {
        if (!department?.trim()) {
            setDepartmentQueueOptions([]);
            return;
        }

        getQueueOptions(department)
            .then((options) => {
                setDepartmentQueueOptions(Array.isArray(options) ? options : []);
            })
            .catch(() => {
                setDepartmentQueueOptions([]);
            });
    }, [department]);

    useEffect(() => {
        const updateNow = () => setNowMs(Date.now());
        updateNow();
        const intervalId = window.setInterval(updateNow, 60_000);

        return () => window.clearInterval(intervalId);
    }, []);

    const { activeQueue } = useClinicQueue(department, initialQueue, callerUserId);

    const departmentQueue = useMemo(() => {
        const mergedQueue = new Map<string, VisitWithPatient>();

        for (const visit of activeQueue) {
            mergedQueue.set(visit.id, visit);
        }

        for (const visit of Object.values(optimisticVisits)) {
            mergedQueue.set(visit.id, visit);
        }

        return Array.from(mergedQueue.values()).filter(
            (visit) => visit.department?.name?.toUpperCase() === department.toUpperCase()
        );
    }, [activeQueue, department, optimisticVisits]);

    const inProgressVisit = departmentQueue.find(
        (visit) => visit.status === "IN_PROGRESS" && visit.calledByUserId === callerUserId
    );
    const activeVisit = inProgressVisit ?? localClaimedVisit;
    const waitingList = departmentQueue.filter((visit) => visit.status === "WAITING_CLINIC");
    const regularWaitingList = waitingList.filter(
        (visit) => visit.classification === "REGULAR" && !visit.isReferred
    );
    const priorityWaitingList = waitingList.filter(
        (visit) => visit.classification === "PRIORITY" || visit.isReferred
    );
    const unifiedWaitingList = useMemo(() => {
        const sortByCreatedAt = (left: VisitWithPatient, right: VisitWithPatient) =>
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();

        return [
            ...[...priorityWaitingList].sort(sortByCreatedAt),
            ...[...regularWaitingList].sort(sortByCreatedAt),
        ];
    }, [priorityWaitingList, regularWaitingList]);

    const noShowList = departmentQueue.filter(
        (visit) =>
            visit.status === "NO_SHOW" &&
            Boolean(visit.sequenceKey?.startsWith("DEPT_")) &&
            visit.calledByUserId === callerUserId
    );
    const priorityCallOptions = useMemo(
        () => departmentQueueOptions
            .filter((option) => option.isPriority)
            .sort((left, right) => left.name.localeCompare(right.name)),
        [departmentQueueOptions]
    );
    const canCallRegular = regularWaitingList.length > 0;
    const canCallPriority = priorityWaitingList.length > 0;
    const currentDepartmentId = allDepartments.find(
        (item) => item.name.toUpperCase() === department.toUpperCase()
    )?.id;
    const { data: snapshotData } = useClinicSnapshot(reportDate, currentDepartmentId, Boolean(currentDepartmentId));

    const handleCallerApiError = (error: unknown, fallbackMessage: string) => {
        if (error instanceof ApiClientError) {
            if (error.code === "CLAIM_INVALID_STATE") {
                notify.info("Patient is no longer active for this session.", {
                    description: "Queue has been updated to the latest state.",
                });
                return;
            }

            if (error.code === "CLAIM_CONFLICT") {
                notify.error("Patient already claimed by another caller.", {
                    description: "Queue refreshed to show latest ownership.",
                });
                router.refresh();
                return;
            }

            if (error.code === "CLAIM_FORBIDDEN_SCOPE") {
                notify.error("Not allowed for this station/department.", {
                    description: "Your account assignment does not match this patient.",
                });
                return;
            }

            notify.error(error.message || fallbackMessage);
            return;
        }

        notify.error(fallbackMessage);
    };

    useEffect(() => {
        if (callAgainCooldown <= 0) {
            return;
        }

        const timer = window.setInterval(() => {
            setCallAgainCooldown((current) => current - 1);
        }, 1000);

        return () => window.clearInterval(timer);
    }, [callAgainCooldown]);

    useEffect(() => {
        if (inProgressVisit) {
            setLocalClaimedVisit(inProgressVisit);
        }
    }, [inProgressVisit]);

    useEffect(() => {
        if (Object.keys(optimisticVisits).length === 0) {
            return;
        }

        setOptimisticVisits((current) => {
            const next = { ...current };
            let changed = false;

            for (const [visitId, optimisticVisit] of Object.entries(current)) {
                const liveVisit = activeQueue.find((visit) => visit.id === visitId);
                if (!liveVisit) {
                    if (optimisticVisit.status === ("COMPLETED" as VisitWithPatient["status"])) {
                        delete next[visitId];
                        changed = true;
                    }
                    continue;
                }

                if (
                    liveVisit.status === optimisticVisit.status &&
                    liveVisit.calledByUserId === optimisticVisit.calledByUserId &&
                    liveVisit.sequenceKey === optimisticVisit.sequenceKey
                ) {
                    delete next[visitId];
                    changed = true;
                }
            }

            return changed ? next : current;
        });
    }, [activeQueue, optimisticVisits]);

    const handleCallQueue = async (
        classification: "REGULAR" | "PRIORITY",
        priorityCategoryKey?: string
    ) => {
        const targetQueue = classification === "PRIORITY" ? priorityWaitingList : regularWaitingList;

        if (targetQueue.length === 0) {
            notify.info(
                classification === "PRIORITY"
                    ? "No more priority patients in the waiting list."
                    : "No more regular patients in the waiting list."
            );
            return;
        }

        if (activeVisit) {
            notify.error("Please Mark Served or No Show the current patient first.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await callNextPatient(classification, priorityCategoryKey);
            if (!res.data) {
                notify.info(
                    classification === "PRIORITY" && priorityCategoryKey
                        ? "No waiting patients for the selected queue option."
                        : classification === "PRIORITY"
                            ? "No more priority patients in the waiting list."
                            : "No more regular patients in the waiting list."
                );
                return;
            }

            const claimedVisit = res.data;
            notify.success(`Calling service ticket P-${claimedVisit.serviceTicket?.toString() ?? "N/A"}`);
            setLocalClaimedVisit(claimedVisit);
            setOptimisticVisits((current) => ({
                ...current,
                [claimedVisit.id]: claimedVisit,
            }));
        } catch (error) {
            handleCallerApiError(error, `Failed to call ${classification.toLowerCase()} patient.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCallAgain = async () => {
        if (!activeVisit) {
            notify.error("No active patient to call.");
            return;
        }

        setIsProcessing(true);
        try {
            await callPatient(activeVisit.id);
            notify.success(`Calling service ticket P-${activeVisit.serviceTicket?.toString() ?? "N/A"} again.`);
            setCallAgainCooldown(10);
        } catch (error) {
            handleCallerApiError(error, "Failed to call patient.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleServe = async () => {
        if (!activeVisit) {
            notify.error("No active patient to serve.");
            return;
        }

        setIsProcessing(true);
        try {
            await servePatient(activeVisit.id);
            setOptimisticVisits((current) => ({
                ...current,
                [activeVisit.id]: {
                    ...activeVisit,
                    status: "COMPLETED" as VisitWithPatient["status"],
                    calledByUserId: callerUserId || activeVisit.calledByUserId,
                },
            }));
            notify.success("Patient consultation completed.");
            setLocalClaimedVisit(null);
        } catch (error) {
            if (error instanceof ApiClientError && error.code === "CLAIM_INVALID_STATE") {
                setOptimisticVisits((current) => ({
                    ...current,
                    [activeVisit.id]: {
                        ...activeVisit,
                        status: "COMPLETED" as VisitWithPatient["status"],
                        calledByUserId: callerUserId || activeVisit.calledByUserId,
                    },
                }));
                setLocalClaimedVisit(null);
            }
            handleCallerApiError(error, "Failed to mark patient as served.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNoShow = async () => {
        if (!activeVisit) {
            notify.error("No active patient to mark as No Show.");
            return;
        }

        setIsProcessing(true);
        try {
            const res = await noShowPatient(activeVisit.id);
            const noShowPayload = (res.data ?? {}) as Partial<VisitWithPatient>;
            const optimisticNoShowVisit: VisitWithPatient = {
                ...activeVisit,
                ...noShowPayload,
                status: "NO_SHOW" as VisitWithPatient["status"],
                calledByUserId: callerUserId || activeVisit.calledByUserId,
                sequenceKey: noShowPayload.sequenceKey
                    ?? activeVisit.sequenceKey
                    ?? (activeVisit.departmentId ? `DEPT_${activeVisit.departmentId}` : null),
            };

            setOptimisticVisits((current) => ({
                ...current,
                [activeVisit.id]: optimisticNoShowVisit,
            }));
            setLocalClaimedVisit(null);
            notify.error(`Service ticket P-${activeVisit.serviceTicket?.toString() ?? "N/A"} marked as NO SHOW`);
        } catch (error) {
            handleCallerApiError(error, "Failed to process No Show.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReferral = async () => {
        if (!activeVisit) {
            notify.error("No active patient selected for referral.");
            return;
        }
        if (!targetDeptId) {
            notify.error("Please select a target department.");
            return;
        }

        setIsProcessing(true);
        try {
            await transferPatient(activeVisit.id, targetDeptId);
            notify.success("Patient referred successfully.");
            resetReferral();
            setLocalClaimedVisit(null);
        } catch (error) {
            handleCallerApiError(error, "An error occurred during referral.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRecallNoShow = async (visitId: string) => {
        setIsProcessing(true);
        try {
            const res = await callPatient(visitId);
            notify.success(`Calling service ticket P-${res.data?.serviceTicket?.toString() ?? "N/A"} again.`);
            if (res.data) {
                setOptimisticVisits((current) => ({
                    ...current,
                    [visitId]: res.data!,
                }));
                setLocalClaimedVisit(res.data);
            }
            setCallAgainCooldown(10);
        } catch (error) {
            handleCallerApiError(error, "Failed to call patient again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-50 p-4 lg:p-6 gap-6">
            <div className="flex flex-col w-full lg:w-[35%] xl:w-[30%] bg-card rounded-xl border border-border overflow-hidden shrink-0 h-auto max-h-[45vh] lg:max-h-none lg:h-full">
                <div className="px-6 py-6 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-foreground">{department}</h2>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab(activeTab === "reports" ? "waitlist" : "reports")}
                        className="text-slate-800 font-bold border-orange-200 bg-yellow-100 hover:bg-yellow-50 rounded-lg"
                    >
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Reports
                    </Button>
                </div>

                <div className="flex border-b border-border bg-background">
                    <button
                        onClick={() => setActiveTab("waitlist")}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === "waitlist" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        WaitList ({unifiedWaitingList.length})
                        {activeTab === "waitlist" ? <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" /> : null}
                    </button>
                    <button
                        onClick={() => setActiveTab("noshow")}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === "noshow" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        No Shows ({noShowList.length})
                        {activeTab === "noshow" ? <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" /> : null}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                    {activeTab === "waitlist" ? (
                        unifiedWaitingList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <CheckCircle size={48} className="mb-4 text-primary/20" weight="duotone" />
                                <p className="text-lg font-bold text-foreground">WaitList Clear</p>
                                <p className="text-sm font-medium text-muted-foreground mt-1">No patients waiting for this clinic.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {unifiedWaitingList.map((visit, index) => {
                                    const isPriorityVisit = visit.classification === "PRIORITY" || visit.isReferred;
                                    const queueTag = getVisitQueueTag(visit);
                                    const isNext = index === 0 && !activeVisit;
                                    const createdAtMs = new Date(visit.createdAt).getTime();
                                    const waitMins = Math.max(0, Math.floor(((nowMs ?? createdAtMs) - createdAtMs) / 60000));
                                    const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins}m`;

                                    return (
                                        <div
                                            key={visit.id}
                                            className={`p-5 border-b border-border relative transition-all group ${isNext ? "bg-muted/30" : "bg-transparent hover:bg-muted/10"}`}
                                        >
                                            {isNext ? <div className={`absolute left-0 top-0 bottom-0 w-1 ${isPriorityVisit ? "bg-amber-500" : "bg-primary"}`} /> : null}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-base font-bold ${isPriorityVisit && isNext ? "text-amber-600" : isNext ? "text-primary" : "text-muted-foreground"}`}>
                                                        {visit.serviceTicket ? `#${visit.serviceTicket}` : "---"}
                                                    </span>
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${isPriorityVisit ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                                        {queueTag}
                                                    </span>
                                                    {visit.isReferred ? (
                                                        <span className="bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                                            <ArrowUpRight size={10} weight="bold" /> Referral
                                                        </span>
                                                    ) : null}
                                                    {isNext ? (
                                                        <span className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/20">
                                                            Next
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                                                    <Clock size={12} weight="bold" /> {waitStr}
                                                </div>
                                            </div>

                                            <span className="font-bold text-sm text-foreground transition-colors group-hover:text-primary">
                                                {visit.patient.lastName}, <span className="text-muted-foreground font-medium">{visit.patient.firstName}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : activeTab === "noshow" ? (
                        noShowList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <UserMinus size={48} className="mb-4 text-muted/30" weight="duotone" />
                                <p className="text-lg font-bold text-muted-foreground">No Show list empty</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {noShowList.map((visit) => (
                                    <div
                                        key={visit.id}
                                        className="p-5 border-b border-border bg-card/50 hover:bg-muted/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-destructive">
                                                    {visit.serviceTicket ? `#${visit.serviceTicket}` : "NO TICKET"}
                                                </span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                                                    {getVisitQueueTag(visit)}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRecallNoShow(visit.id)}
                                                disabled={isProcessing}
                                                className="h-8 px-3 border-border bg-background text-foreground hover:bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Call Patient Again
                                            </Button>
                                        </div>
                                        <span className="font-bold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                            {visit.patient.lastName}, <span className="font-medium">{visit.patient.firstName}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : activeTab === "reports" ? (
                        <div className="flex flex-col gap-4 p-5">
                            <ReportDatePicker value={reportDate} onChange={setReportDate} />
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <ReportMetricCard
                                    label="Patients Served"
                                    value={snapshotData.totals.totalPatientsServed.toString()}
                                    hint="Completed consultations for this department and date."
                                    tone="success"
                                />
                                <ReportMetricCard
                                    label="Clinic No-Shows"
                                    value={snapshotData.totals.clinicNoShowCount.toString()}
                                    hint="Patients routed to clinic but not served."
                                    tone="warning"
                                />
                                <ReportMetricCard
                                    label="Average Wait Time"
                                    value={`${snapshotData.totals.avgWaitMinutes}m`}
                                    hint="WAITING_CLINIC to IN_PROGRESS."
                                />
                                <ReportMetricCard
                                    label="Average Serve Time"
                                    value={`${snapshotData.totals.avgServeMinutes}m`}
                                    hint="IN_PROGRESS to COMPLETED."
                                    tone="success"
                                />
                            </div>
                            <ReportBreakdownCard
                                title="Referral & Transfer Summary"
                                emptyLabel="No clinic referrals or transfers were recorded for this date."
                                items={[
                                    { id: "transfers", label: "Transferred / Referred", value: snapshotData.totals.transferCount },
                                    { id: "transfer-rate", label: "Transfer Rate", value: `${snapshotData.totals.transferRate}%` },
                                    { id: "department", label: "Scoped Department", value: snapshotData.department?.name ?? department },
                                ]}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col min-h-0 flex-1 bg-slate-50 rounded-xl border border-border overflow-hidden relative shadow-sm">
                <header className="px-8 py-6 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-20 shadow-sm">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black text-foreground uppercase tracking-widest">{department}</h2>
                    </div>

                    {activeVisit ? (
                        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 italic font-medium text-xs">
                            Patient is currently being served...
                        </div>
                    ) : null}
                </header>

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col relative w-full bg-background/50">
                    {!activeVisit ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5 animate-in fade-in duration-500">
                            <div className="w-24 h-24 bg-background rounded-full border border-border flex items-center justify-center mb-8 shadow-xl relative group">
                                <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping opacity-20" />
                                <Users size={40} className="text-emerald-300 relative z-10" weight="duotone" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Ready to Call</h2>
                            <p className="text-muted-foreground text-sm font-medium max-w-sm leading-relaxed">
                                Use the <strong className="text-foreground">Call Regular</strong> or <strong className="text-foreground">Call Priority</strong> buttons below to start serving patients from the selected queue.
                            </p>
                            <div className="flex items-center gap-4 mt-8">
                                <Button
                                    onClick={() => handleCallQueue("REGULAR")}
                                    disabled={isProcessing || !canCallRegular}
                                    className="h-14 px-8 w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm shadow-emerald-500/10 font-black uppercase tracking-[0.18em] text-[11px] rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? <div className="w-4 h-4 border-2 border-emerald-800/20 border-t-emerald-700 rounded-full animate-spin" /> : <SpeakerHigh size={18} weight="bold" />}
                                    <span>CALL REGULAR</span>
                                </Button>

                                <div className="flex items-center">
                                    <Button
                                        onClick={() => handleCallQueue("PRIORITY")}
                                        disabled={isProcessing || !canCallPriority}
                                        className="h-14 px-8 w-full sm:w-auto bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-sm shadow-amber-500/10 font-black uppercase tracking-[0.18em] text-[11px] rounded-l-xl rounded-r-none transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? <div className="w-4 h-4 border-2 border-amber-900/20 border-t-amber-800 rounded-full animate-spin" /> : <SpeakerHigh size={18} weight="bold" />}
                                        <span>CALL PRIORITY</span>
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isProcessing || !canCallPriority || priorityCallOptions.length === 0}
                                                className="h-14 px-4 border-amber-200 text-amber-900 bg-amber-50/80 hover:bg-amber-100 rounded-r-xl rounded-l-none"
                                                aria-label="Select priority queue option"
                                            >
                                                <CaretDown size={18} weight="bold" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            {priorityCallOptions.length === 0 ? (
                                                <DropdownMenuItem disabled>No priority options configured</DropdownMenuItem>
                                            ) : (
                                                priorityCallOptions.map((option) => {
                                                    const priorityKey = option.code?.trim() || option.name.trim();
                                                    return (
                                                        <DropdownMenuItem
                                                            key={option.id}
                                                            onClick={() => handleCallQueue("PRIORITY", priorityKey)}
                                                        >
                                                            {getPriorityOptionLabel(option)}
                                                        </DropdownMenuItem>
                                                    );
                                                })
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10 relative bg-white/50 animate-in slide-in-from-bottom-4 duration-500 w-full">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex flex-col">
                                        <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 w-full">
                                            <div className="flex flex-col justify-center items-center w-40 h-40 shrink-0 bg-white rounded-3xl shadow-xl border border-emerald-100 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-emerald-50/50 group-hover:bg-emerald-50 transition-colors" />
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <span className="text-[11px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Service Ticket</span>
                                                    <span className="text-5xl font-black text-emerald-900 tracking-tighter">
                                                        {activeVisit.serviceTicket ? `#${activeVisit.serviceTicket}` : "---"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3 truncate w-full">
                                                    {activeVisit.patient.firstName} {activeVisit.patient.lastName}
                                                </h1>

                                                <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold text-slate-500 mb-4">
                                                    <span className="flex items-center gap-2 text-slate-600">
                                                        {activeVisit.patient.gender} • {calculateAge(activeVisit.patient.dateOfBirth) ?? "??"} years old
                                                    </span>
                                                    <span className="bg-emerald-600 text-white text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-sm shadow-emerald-200">
                                                        {getVisitQueueTag(activeVisit)}
                                                    </span>
                                                </div>
                                                {activeVisit.patient.contactNo ? (
                                                    <div className="flex items-center gap-2 text-[14px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                                                        <Phone size={16} weight="duotone" />
                                                        {activeVisit.patient.contactNo}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                            <Info size={16} className="text-primary" /> Intake Information
                                        </h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-primary/50">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Chief Complaint</span>
                                                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                                                    &quot;{activeVisit.chiefComplaint || "No complaint recorded."}&quot;
                                                </p>
                                            </div>
                                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-destructive flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Blood Pressure</span>
                                                    <span className="text-2xl font-bold text-destructive tracking-tighter">
                                                        {activeVisit.bloodPressure || "--/--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">mmHg</span>
                                                    </span>
                                                </div>
                                                <Heartbeat size={32} weight="duotone" className="text-destructive/20" />
                                            </div>
                                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-primary flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Temperature</span>
                                                    <span className="text-2xl font-bold text-foreground tracking-tighter">
                                                        {activeVisit.temperature || "--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">°C</span>
                                                    </span>
                                                </div>
                                                <Thermometer size={32} weight="duotone" className="text-primary/20" />
                                            </div>
                                            <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-blue-500/50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Heart Rate</span>
                                                    <span className="text-2xl font-bold text-foreground tracking-tighter">
                                                        {activeVisit.heartRate || "--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">bpm</span>
                                                    </span>
                                                </div>
                                                <Info size={32} weight="duotone" className="text-blue-500/10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-background/80 backdrop-blur-md border-t border-border p-6 lg:p-8 shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] w-full">
                                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 w-full">
                                    <div className="flex gap-3 w-full md:w-auto justify-start">
                                        <Button
                                            variant="outline"
                                            onClick={() => setReferralModalOpen(true)}
                                            disabled={isProcessing}
                                            className="h-12 px-6 border-border bg-background text-foreground hover:bg-muted rounded-xl font-bold uppercase tracking-widest text-[11px] shrink-0 transition-all active:scale-95 shadow-sm"
                                        >
                                            <ArrowSquareOut size={16} weight="bold" className="mr-2 text-primary" /> Referral
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={handleNoShow}
                                            disabled={isProcessing}
                                            className="h-12 px-6 border-border bg-background text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 rounded-xl font-bold uppercase tracking-widest text-[11px] shrink-0 transition-all active:scale-95 shadow-sm"
                                        >
                                            <UserMinus size={16} weight="bold" className="mr-2" /> No Show
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto">
                                        <Button
                                            variant="outline"
                                            onClick={handleCallAgain}
                                            disabled={isProcessing || callAgainCooldown > 0}
                                            className="h-12 px-6 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-sm min-w-35"
                                        >
                                            <SpeakerHigh size={16} weight="bold" className="mr-2" />
                                            {callAgainCooldown > 0 ? `Call Again (${callAgainCooldown}s)` : "Call Again"}
                                        </Button>
                                        <Button
                                            onClick={handleServe}
                                            disabled={isProcessing}
                                            className="w-full md:w-auto h-12 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                        >
                                            <CheckCircle size={18} weight="fill" className="mr-2" /> Finish Consultation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Dialog open={isReferralModalOpen} onOpenChange={setReferralModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-8 border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground tracking-tight">Refer Patient</DialogTitle>
                        <p className="text-muted-foreground font-medium text-sm mt-1">
                            Choose the department you want to refer this patient to.
                        </p>
                    </DialogHeader>

                    <div className="py-8">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Target Department</label>
                        <SearchableSelect
                            options={allDepartments
                                .filter((item) => item.name.toUpperCase() !== department.toUpperCase())
                                .map((item) => ({ label: item.name, value: item.id }))}
                            value={targetDeptId}
                            onSelect={setTargetDeptId}
                            placeholder="Choose department..."
                            searchPlaceholder="Search department..."
                            className="h-12 text-sm font-bold rounded-xl"
                        />
                    </div>

                    <DialogFooter className="flex gap-3 sm:justify-end">
                        <Button
                            variant="ghost"
                            className="h-12 rounded-xl border-border font-bold px-6"
                            onClick={() => setReferralModalOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest px-8 shadow-md shadow-primary/10"
                            onClick={handleReferral}
                            disabled={isProcessing || !targetDeptId}
                        >
                            {isProcessing ? "Processing..." : "Confirm Referral"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
