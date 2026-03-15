"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { PriorityCategory, Department } from "@/types/models";
import { useState } from "react";
import { useReleasingQueue } from "../hooks";
import { QueueCategory, ReleasingQueueTable } from "./releasing-queue-table";
import { ReleasingAssignPanel } from "./releasing-assign-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateAge } from "@/lib/utils";
import { Queue, ChartBar } from "@phosphor-icons/react";

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
                        <div className="text-right">
                           {/* Station info could go here */}
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
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-sm">
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
