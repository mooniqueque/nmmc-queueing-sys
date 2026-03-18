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
import { calculateAge } from "@/lib/utils";
import { Department, PriorityCategory } from "@/types/models";
import { ArrowsCounterClockwise, ChartBar, Queue, CheckCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { resetDailyQueue } from "../actions";
import { useReleasingQueue } from "../hooks";
import { ReleasingAssignPanel } from "./releasing-assign-panel";
import { QueueCategory, ReleasingQueueTable } from "./releasing-queue-table";

// ─── Auto-categorization logic ────────────────────────────────

export function categorizeVisit(visit: VisitWithPatient): Exclude<QueueCategory, "ALL"> {
    if (visit.status === 'NO_SHOW') return "NO_SHOW";

    // Explicit priority from classification field
    if (visit.classification === 'PRIORITY') return "PRIORITY";

    // Fallback/Draft logic for UI consistency
    if (visit.isInfectious) return "PRIORITY";
    if (visit.disposition?.toUpperCase().includes("ER")) return "PRIORITY";

    const age = calculateAge(visit.patient.dateOfBirth);
    if (visit.hasAppointment) return "PRIORITY";
    if (age !== null && (age < 12 || age >= 60)) return "PRIORITY";

    return "REGULAR";
}

export function getCategoryBadges(visit: VisitWithPatient): string[] {
    const badges: string[] = [];

    // Use dynamic categories if available
    if (visit.categories && visit.categories.length > 0) {
        visit.categories.forEach(vc => {
            if (vc.category?.name) badges.push(vc.category.name);
        });
    }

    // Fallbacks if categories haven't been processed or for legacy items
    if (badges.length === 0) {
        if (visit.isInfectious) badges.push("INFECTIOUS");
        if (visit.disposition?.toUpperCase().includes("ER")) badges.push("ER-REF");
        if (visit.hasAppointment) badges.push("APPT");

        const age = calculateAge(visit.patient.dateOfBirth);
        if (age !== null) {
            if (age < 12) badges.push("CHILD");
            if (age >= 60) badges.push("SENIOR");
        }
    }

    if (visit.kioskRegistrationType) {
        badges.push(visit.kioskRegistrationType);
    }
    
    return badges;
}

// ─── Main Entry ───────────────────────────────────────────────
interface ReleasingEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, PriorityCategory[]>;
}

export function ReleasingEntry({ initialQueue, departments, queueOptionsByDepartment }: ReleasingEntryProps) {
    const { activeQueue } = useReleasingQueue(initialQueue);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const selectedPatient = selectedPatientId ? activeQueue.find(v => v.id === selectedPatientId) || null : null;
    const [activeTab, setActiveTab] = useState<QueueCategory>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [resetDialogOpen, setResetDialogOpen] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            const res = await resetDailyQueue();
            if (res.success) {
                toast.success("Queue Reset", { description: "Daily sequence and visits have been reset successfully." });
                setResetDialogOpen(false);
            } else {
                toast.error("Reset Failed", { description: res.message || "Could not reset queue." });
            }
        } catch {
            toast.error("Error", { description: "An unexpected error occurred during reset." });
        } finally {
            setIsResetting(false);
        }
    };

    // Categorize each visit
    const categorized = activeQueue.map(visit => ({
        visit,
        category: categorizeVisit(visit),
        badges: getCategoryBadges(visit),
    }));

    // Filter by Search Query
    const searchFiltered = categorized.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (c.visit.ticketNumber?.toString().includes(q) ?? false) ||
            c.visit.patient.firstName.toLowerCase().includes(q) ||
            c.visit.patient.lastName.toLowerCase().includes(q)
        );
    });

    // Counts (based on search filtered)
    const counts = {
        ALL: searchFiltered.filter(c => c.category !== "NO_SHOW").length,
        PRIORITY: searchFiltered.filter(c => c.category === "PRIORITY").length,
        REGULAR: searchFiltered.filter(c => c.category === "REGULAR").length,
        NO_SHOW: searchFiltered.filter(c => c.category === "NO_SHOW").length,
    };

    // Filter by Tab
    const filtered = activeTab === "ALL"
        ? searchFiltered.filter(c => c.category !== "NO_SHOW")
        : searchFiltered.filter(c => c.category === activeTab);

    // Sort: within each view, PRIORITY first, then REGULAR, then by ticket number
    const sorted = [...filtered].sort((a, b) => {
        const order: Record<string, number> = { PRIORITY: 0, REGULAR: 1, NO_SHOW: 2 };
        const catDiff = (order[a.category] ?? 3) - (order[b.category] ?? 3);
        if (catDiff !== 0) return catDiff;
        return (a.visit.ticketNumber ?? 0) - (b.visit.ticketNumber ?? 0);
    });

    const handleAssignComplete = () => {
        setSelectedPatientId(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background">
            <div className="bg-card border-b border-border px-8 py-4 shrink-0 shadow-sm z-10">
                <Tabs defaultValue="queue" className="w-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                                    <Queue size={20} weight="bold" className="text-primary" />
                                    Window Registration
                                </h1>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">NMMC Releasing Unit</p>
                            </div>
                            <TabsList className="bg-muted/50 rounded-lg p-1 h-10 border border-border py-5 px-1">
                                <TabsTrigger value="queue" className="rounded-md h-8 px-5 font-bold text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                                    <Queue size={16} weight="bold" />
                                    Active Queue
                                </TabsTrigger>
                                <TabsTrigger value="successful" className="rounded-md h-8 px-5 font-bold text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                                    <CheckCircle size={16} weight="bold" />
                                    Successful Forwarded Forms
                                </TabsTrigger>
                                <TabsTrigger value="reports" className="rounded-md h-8 px-5 font-bold text-xs data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-200 gap-2">
                                    <ChartBar size={16} weight="bold" />
                                    Reports
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-4">
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-lg font-bold text-destructive hover:bg-destructive/5 hover:text-destructive gap-2 h-9 border border-border">
                                        <ArrowsCounterClockwise size={16} weight="bold" className={isResetting ? "animate-spin" : ""} />
                                        <span>Reset Queue</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-xl p-8 border-border shadow-xl">
                                    <DialogHeader className="pt-2">
                                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6 mx-auto">
                                            <ArrowsCounterClockwise size={24} weight="bold" />
                                        </div>
                                        <DialogTitle className="text-center text-xl font-bold text-foreground tracking-tight mb-2">Reset Daily Queue?</DialogTitle>
                                        <DialogDescription className="text-center text-muted-foreground font-medium text-sm leading-relaxed">
                                            This action will reset the ticket sequence to <span className="font-bold text-foreground">1</span> and clear all pending visits. This is irreversible.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-8 flex gap-3 sm:justify-center">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setResetDialogOpen(false)}
                                            className="flex-1 h-11 rounded-lg font-bold text-muted-foreground hover:bg-muted"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                            disabled={isResetting}
                                            className="flex-1 h-11 rounded-lg font-bold bg-destructive hover:bg-destructive/90 text-white shadow-sm"
                                        >
                                            {isResetting ? "Resetting..." : "Confirm Reset"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <div className="text-right">
                                {/* Station info could go here */}
                            </div>
                        </div>
                    </div>

                    <TabsContent value="queue" className="mt-6 focus-visible:outline-none">
                        <div className="flex flex-col lg:flex-row h-full w-full gap-6 pb-8">
                            {/* Left Box: Queue Table */}
                            <div className={`flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${selectedPatient ? "lg:w-[60%] xl:w-[65%]" : "w-full"}`}>
                                <ReleasingQueueTable
                                    items={sorted}
                                    counts={counts}
                                    activeTab={activeTab}
                                    onTabChange={setActiveTab}
                                    searchQuery={searchQuery}
                                    onSearchChange={setSearchQuery}
                                    selectedPatientId={selectedPatient?.id}
                                    onSelectPatient={(p) => setSelectedPatientId(p.id)}
                                    isPanelOpen={!!selectedPatient}
                                />
                            </div>

                            {/* Right Box: Floating Assignment Side-Panel */}
                            {selectedPatient && (
                                <div className="flex flex-col w-full lg:w-[40%] xl:w-[35%] animate-in slide-in-from-right-8 fade-in duration-500">
                                    <ReleasingAssignPanel
                                        selectedPatient={selectedPatient}
                                        departments={departments}
                                        queueOptionsByDepartment={queueOptionsByDepartment}
                                        badges={categorized.find(c => c.visit.id === selectedPatient.id)?.badges ?? []}
                                        onClose={() => setSelectedPatientId(null)}
                                        onAssignComplete={handleAssignComplete}
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="mt-6 focus-visible:outline-none h-full">
                        <div className="bg-card rounded-xl border border-border border-dashed p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <ChartBar size={48} weight="duotone" className="text-muted/30 mb-6" />
                            <h3 className="text-lg font-bold text-foreground">Registration Reports</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mt-2 font-medium">Detailed analytics for processing times and patient throughput will be available in the next update.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="successful" className="mt-6 focus-visible:outline-none h-full">
                        <div className="bg-card rounded-xl border border-border border-dashed p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <CheckCircle size={48} weight="duotone" className="text-muted/30 mb-6" />
                            <h3 className="text-lg font-bold text-foreground">Successful Forwarded Forms</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mt-2 font-medium">List of successfully forwarded forms will appear here.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
