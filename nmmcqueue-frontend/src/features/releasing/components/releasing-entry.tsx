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
import { ArrowsCounterClockwise, ChartBar, Queue } from "@phosphor-icons/react";
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
    if (age < 12 || age >= 60) return "PRIORITY";

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
        if (age < 12) badges.push("CHILD");
        if (age >= 60) badges.push("SENIOR");
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
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
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
        } catch (err) {
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
            c.visit.ticketNumber.toString().includes(q) ||
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
        return a.visit.ticketNumber - b.visit.ticketNumber;
    });

    const handleAssignComplete = () => {
        setSelectedPatient(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50">
            <div className="bg-white border-b px-8 py-4 shrink-0">
                <Tabs defaultValue="queue" className="w-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <Queue size={24} weight="duotone" className="text-emerald-600" />
                                Window Registration
                            </h1>
                            <TabsList className="bg-slate-100 rounded-xl p-1 h-11 border border-slate-200/50">
                                <TabsTrigger value="queue" className="rounded-lg h-9 px-6 font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all duration-300 gap-2">
                                    <Queue size={18} weight="bold" />
                                    Active Queue
                                </TabsTrigger>
                                <TabsTrigger value="reports" className="rounded-lg h-9 px-6 font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all duration-300 gap-2">
                                    <ChartBar size={18} weight="bold" />
                                    Performance Reports
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex items-center gap-4">
                            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white text-rose-600 border-rose-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all gap-2 h-10 shadow-sm border-2">
                                        <ArrowsCounterClockwise size={18} weight="bold" className={isResetting ? "animate-spin" : ""} />
                                        <span>Reset Daily Queue</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-[2rem] p-8 border-0 shadow-2xl">
                                    <DialogHeader className="pt-2">
                                        <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-6 mx-auto">
                                            <ArrowsCounterClockwise size={32} weight="duotone" />
                                        </div>
                                        <DialogTitle className="text-center text-2xl font-black text-slate-800 tracking-tight mb-2">Are you absolutely sure?</DialogTitle>
                                        <DialogDescription className="text-center text-slate-500 font-medium leading-relaxed">
                                            This action will reset the ticket sequence to <span className="font-bold text-slate-800">1</span> and clear all pending visits from the queue. This is irreversible.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="mt-8 flex-col sm:flex-row gap-3">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => setResetDialogOpen(false)}
                                            className="w-full sm:flex-1 h-12 rounded-2xl font-bold text-slate-600 hover:bg-slate-50"
                                        >
                                            Nevermind
                                        </Button>
                                        <Button 
                                            onClick={handleReset}
                                            disabled={isResetting}
                                            className="w-full sm:flex-1 h-12 rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
                                        >
                                            {isResetting ? "Resetting..." : "Yes, Reset All"}
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
                                    onSelectPatient={setSelectedPatient}
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
                                        onClose={() => setSelectedPatient(null)}
                                        onAssignComplete={handleAssignComplete}
                                    />
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="mt-6 focus-visible:outline-none">
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-100 shadow-sm">
                            <ChartBar size={64} weight="duotone" className="text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">Registration Reports</h3>
                            <p className="text-slate-500 max-w-sm mt-1">Detailed analytics for window processing times and patient throughput will be available soon.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
