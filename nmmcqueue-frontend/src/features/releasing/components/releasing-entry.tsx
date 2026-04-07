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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitWithPatient } from "@/features/triage/types";
import { Department, PriorityCategory } from "@/shared/types/models";
import { ArrowsCounterClockwise, ChartBar, Queue, Play, User } from "@phosphor-icons/react";
import { useState, useTransition, useEffect } from "react";
import { notify } from "@/shared/lib/notify";
import { resetDailyQueue, callNextWindow, callTicket } from "../actions";
import { useReleasingQueue } from "../hooks";
import { ReleasingAssignPanel } from "./releasing-assign-panel";
import { ReleasingQueueTable, QueueCategory } from "./releasing-queue-table";
import { SessionUser } from "@/shared/types/auth";
import { ReportBreakdownCard, ReportDatePicker, ReportMetricCard, getTodayBusinessDay } from "@/features/shared/components/operational-report-panel";
import { useWindowSnapshot } from "@/features/shared/hooks/use-operational-snapshot";

// ─── Main Entry ───────────────────────────────────────────────
interface ReleasingEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, PriorityCategory[]>;
    currentVisit: VisitWithPatient | null;
    user?: SessionUser;
}

export function ReleasingEntry({ initialQueue, departments, queueOptionsByDepartment, currentVisit, user }: ReleasingEntryProps) {
    const { activeQueue } = useReleasingQueue(initialQueue);
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
    const [activeTab, setActiveTab] = useState<QueueCategory>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [cooldown, setCooldown] = useState(0);

    const [reportDate, setReportDate] = useState(getTodayBusinessDay());
    const { data: snapshotData } = useWindowSnapshot(reportDate);

    // Determine window type from user's station
    const stationNo = user?.workstation?.stationNo ?? 1;
    const isPriorityWindow = stationNo >= 1 && stationNo <= 2;

    // Call Again Cooldown Timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Auto-select the claimed patient on mount
    useEffect(() => {
        if (currentVisit) {
            setSelectedPatient(currentVisit);
        }
    }, [currentVisit]);

    const hasActivePatient = !!currentVisit;


    // ─── Call Next / Call Selected ───────────────────────
    const handleCallNext = () => {

        // If a patient is manually selected (Waiting or No-Show) and no one is currently being served, call THEM
        if (false && !currentVisit && selectedPatient) {
            startTransition(async () => {
                const res = await callTicket(selectedPatient!.id);
                if (res?.success) {
                    notify.success("Patient called to window", {
                        description: `${selectedPatient!.patient.lastName}, ${selectedPatient!.patient.firstName} — Window ${stationNo}`
                    });
                } else {
                    notify.error(res?.message || res?.error || "Failed to call selected patient");
                }
            });
            return;
        }

        // Tab-Aware Calling: If no manual selection, focus on the active tab's category
        startTransition(async () => {
            const res = await callNextWindow();
            if (res?.success && res.data) {
                setSelectedPatient(res.data);
                notify.success("Patient claimed", {
                    description: `${res.data.patient.lastName}, ${res.data.patient.firstName} — Window ${stationNo}`
                });
            } else if (res?.success && !res.data) {
                notify.info("Queue is empty", { 
                    description: "No patients waiting for window." 
                });
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
                setCooldown(10); // 10 second cooldown
                notify.success("Patient called again", {
                    description: `Ringing bell for ${currentVisit.patient.lastName}, Window ${stationNo}`
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

    // ─── Queue filtering (backend already sorts by priority) ─────
    const waitingQueue = activeQueue.filter(v => v.status === 'WAITING_WINDOW');
    const noShowQueue = activeQueue.filter(v => v.status === 'NO_SHOW');

    const searchFiltered = [...waitingQueue, ...noShowQueue].filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (c.triageTicket?.toString().includes(q) ?? false) ||
            c.patient.firstName.toLowerCase().includes(q) ||
            c.patient.lastName.toLowerCase().includes(q)
        );
    });

    const counts = {
        ALL: searchFiltered.filter(c => c.status !== 'NO_SHOW').length,
        PRIORITY: searchFiltered.filter(c => c.classification === 'PRIORITY' && c.status !== 'NO_SHOW').length,
        REGULAR: searchFiltered.filter(c => c.classification === 'REGULAR' && c.status !== 'NO_SHOW').length,
        NO_SHOW: searchFiltered.filter(c => c.status === 'NO_SHOW').length,
    };

    const tabFiltered = activeTab === "ALL"
        ? searchFiltered.filter(c => c.status !== 'NO_SHOW')
        : activeTab === "NO_SHOW"
            ? searchFiltered.filter(c => c.status === 'NO_SHOW')
            : searchFiltered.filter(c => c.classification === activeTab && c.status !== 'NO_SHOW');

    const handleAssignComplete = () => {
        setSelectedPatient(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background">
            <div className="bg-card border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4 shrink-0 shadow-sm z-10">
                <Tabs defaultValue="queue" className="w-full">
                    {/* ─── Header Bar ─── */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-8 w-full sm:w-auto">
                            {/* Title */}
                            <div className="flex flex-col shrink-0">
                                <h1 className="text-sm sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                    <Queue size={18} weight="bold" className="text-primary" />
                                    <span className="hidden sm:inline">Window Registration</span>
                                    <span className="sm:hidden">Window</span>
                                </h1>
                                <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
                                    Station {stationNo} • {isPriorityWindow ? 'Priority' : 'Regular'}
                                </p>
                            </div>

                            {/* Tabs */}
                            <TabsList className="bg-muted/50 rounded-lg p-0.5 sm:p-1 h-8 sm:h-10 border border-border">
                                <TabsTrigger value="queue" className="rounded-md h-7 sm:h-8 px-2.5 sm:px-5 font-bold text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-1.5">
                                    <Queue size={14} weight="bold" />
                                    <span className="hidden sm:inline">Active Queue</span>
                                    <span className="sm:hidden">Queue</span>
                                </TabsTrigger>
                                <TabsTrigger value="reports" className="rounded-md h-7 sm:h-8 px-2.5 sm:px-5 font-bold text-[10px] sm:text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-1.5">
                                    <ChartBar size={14} weight="bold" />
                                    <span className="hidden sm:inline">Reports</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* ─── Right: Call Next + Reset ─── */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Call Next Button */}
                            <div className="relative flex-1 sm:flex-none">
                                <Button
                                    onClick={handleCallNext}
                                    disabled={isPending || hasActivePatient}
                                    className="flex-1 sm:flex-none h-9 sm:h-10 px-3 sm:px-5 font-bold text-xs sm:text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all gap-2 disabled:opacity-50"
                                >
                                    <Play size={14} weight="fill" />
                                    <span className="hidden sm:inline">Call Next</span>
                                    <span className="sm:hidden">Call</span>
                                </Button>
                            </div>

                            {/* Reset */}
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 sm:h-10 px-2 sm:px-3 rounded-lg font-bold text-destructive hover:bg-destructive/5 hover:text-destructive border border-border shrink-0">
                                        <ArrowsCounterClockwise size={16} weight="bold" className={isResetting ? "animate-spin" : ""} />
                                        <span className="hidden sm:inline ml-1.5">Reset</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-xl p-6 sm:p-8 border-border shadow-xl">
                                    <DialogHeader className="pt-2">
                                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6 mx-auto">
                                            <ArrowsCounterClockwise size={24} weight="bold" />
                                        </div>
                                        <DialogTitle className="text-center text-lg sm:text-xl font-bold text-foreground tracking-tight mb-2">Reset Daily Queue?</DialogTitle>
                                        <DialogDescription className="text-center text-muted-foreground font-medium text-sm leading-relaxed">
                                            This action will reset the ticket sequence to <span className="font-bold text-foreground">1</span> and clear all pending visits. This is irreversible.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-8 flex gap-3 sm:justify-center">
                                        <Button variant="ghost" onClick={() => setResetDialogOpen(false)} className="flex-1 h-11 rounded-lg font-bold text-muted-foreground hover:bg-muted">Cancel</Button>
                                        <Button onClick={handleReset} disabled={isResetting} className="flex-1 h-11 rounded-lg font-bold bg-destructive hover:bg-destructive/90 text-white shadow-sm">
                                            {isResetting ? "Resetting..." : "Confirm Reset"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* ─── Current Patient Banner ─── */}
                    {currentVisit && (
                        <div
                            className="mt-3 sm:mt-4 border-2 border-primary/30 bg-primary/5 rounded-xl px-3 sm:px-5 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => setSelectedPatient(currentVisit)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <User size={18} weight="bold" className="text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest">Currently Serving • Window {stationNo}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    </div>
                                    <div className="text-xs sm:text-sm font-bold text-foreground truncate">
                                        {currentVisit.triageTicket && (
                                        <span className="text-primary mr-2">
                                                Triage {currentVisit.classification === 'PRIORITY' ? 'PRIO' : 'REG'}-{currentVisit.triageTicket.toString().padStart(2, '0')}
                                        </span>
                                        )}
                                        {currentVisit.patient.lastName}, {currentVisit.patient.firstName}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCallAgain();
                                    }}
                                    disabled={isPending || cooldown > 0}
                                    className="h-8 px-3 bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest rounded-lg gap-2 shadow-sm disabled:bg-muted disabled:text-muted-foreground transition-all"
                                >
                                    {cooldown > 0 ? (
                                        <>
                                            <ArrowsCounterClockwise size={12} weight="bold" className="animate-spin" />
                                            Reload ({cooldown}s)
                                        </>
                                    ) : (
                                        <>
                                            <Play size={12} weight="fill" />
                                            Call Again
                                        </>
                                    )}
                                </Button>
                                <span className={`hidden sm:inline text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${currentVisit.classification === 'PRIORITY' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {currentVisit.classification}
                                </span>
                            </div>
                        </div>
                    )}

                    <TabsContent value="queue" className="mt-4 sm:mt-6 focus-visible:outline-none">
                        <div className="flex flex-col lg:flex-row h-full w-full gap-3 sm:gap-4 lg:gap-6 pb-4 sm:pb-8">
                            {/* Left Box: Queue Table */}
                            <div className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${selectedPatient ? "lg:w-[55%] xl:w-[55%]" : "w-full"}`}>
                                <ReleasingQueueTable
                                    items={tabFiltered}
                                    counts={counts}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    isPanelOpen={!!selectedPatient}
                                    onRowClick={(p) => {
                                        // Ensure we do not re-select the currently serving patient into the assign panel
                                        // Unless they are actually just waiting or no-show.
                                        setSelectedPatient(p);
                                    }}
                                />
                            </div>

                            {/* Right Box: Assignment Panel */}
                            {selectedPatient && (
                                <div className="flex flex-col w-full lg:w-[45%] xl:w-[45%] animate-in slide-in-from-right-8 fade-in duration-500">
                                    <ReleasingAssignPanel
                                        selectedPatient={selectedPatient}
                                        departments={departments}
                                        queueOptionsByDepartment={queueOptionsByDepartment}
                                        badges={[]}
                                        onClose={() => setSelectedPatient(null)}
                                        onAssignComplete={handleAssignComplete}
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="mt-4 sm:mt-6 focus-visible:outline-none">
                        <div className="space-y-6 pb-8">
                            <ReportDatePicker value={reportDate} onChange={setReportDate} />

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                <ReportMetricCard
                                    label="Assigned To Clinics"
                                    value={snapshotData.totals.totalAssignedToClinics.toString()}
                                    hint="Patients successfully handed off from the window."
                                />
                                <ReportMetricCard
                                    label="Window No-Shows"
                                    value={snapshotData.totals.windowNoShowCount.toString()}
                                    hint={`${snapshotData.totals.windowNoShowRate}% of called patients did not appear.`}
                                    tone="warning"
                                />
                                <ReportMetricCard
                                    label="Average Window Time"
                                    value={`${snapshotData.totals.avgWindowProcessingMinutes}m`}
                                    hint="Approximate time spent in the window phase."
                                    tone="success"
                                />
                                <ReportMetricCard
                                    label="Total Window Calls"
                                    value={snapshotData.totals.totalWindowCalls.toString()}
                                    hint="Patients moved into active window handling."
                                />
                            </div>

                            <ReportBreakdownCard
                                title="Processed Per Window Station"
                                emptyLabel="No patients were processed by any window station for this date."
                                items={snapshotData.processedPerStation.map((item) => ({
                                    id: `${item.stationNo}`,
                                    label: `Window ${item.stationNo}`,
                                    value: item.count,
                                }))}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
