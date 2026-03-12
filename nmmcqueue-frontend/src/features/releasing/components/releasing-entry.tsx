"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { Department } from "@/types/models";
import { useState } from "react";
import { useReleasingQueue } from "../hooks";
import { ReleasingQueueTable } from "./releasing-queue-table";
import { ReleasingAssignPanel } from "./releasing-assign-panel";

// ─── Auto-categorization logic ────────────────────────────────
type QueueCategory = "ALL" | "PRIORITY" | "REGULAR";

export function categorizeVisit(visit: VisitWithPatient): Exclude<QueueCategory, "ALL"> {
    // Treat previously "URGENT" items as PRIORITY
    if (visit.isInfectious) return "PRIORITY";
    if (visit.disposition?.toUpperCase().includes("ER")) return "PRIORITY";

    // PRIORITY: has appointment, children (<12), seniors (>=60)
    if (visit.hasAppointment) return "PRIORITY";
    if (visit.patient.age < 12 || visit.patient.age >= 60) return "PRIORITY";

    return "REGULAR";
}

export function getCategoryBadges(visit: VisitWithPatient): string[] {
    const badges: string[] = [];
    if (visit.isInfectious) badges.push("INFECTIOUS");
    if (visit.disposition?.toUpperCase().includes("ER")) badges.push("ER-REF");
    if (visit.hasAppointment) badges.push("APPT");
    if (visit.patient.age < 12) badges.push("CHILD");
    if (visit.patient.age >= 60) badges.push("SENIOR");
    return badges;
}

// ─── Main Entry ───────────────────────────────────────────────
interface ReleasingEntryProps {
    initialQueue: VisitWithPatient[];
    departments: Department[];
    queueOptionsByDepartment: Record<string, string[]>;
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
        ALL: searchFiltered.length,
        PRIORITY: searchFiltered.filter(c => c.category === "PRIORITY").length,
        REGULAR: searchFiltered.filter(c => c.category === "REGULAR").length,
    };

    // Filter by Tab
    const filtered = activeTab === "ALL"
        ? searchFiltered
        : searchFiltered.filter(c => c.category === activeTab);

    // Sort: within each view, PRIORITY first, then REGULAR, then by ticket number
    const sorted = [...filtered].sort((a, b) => {
        const order: Record<string, number> = { PRIORITY: 0, REGULAR: 1 };
        const catDiff = (order[a.category] ?? 2) - (order[b.category] ?? 2);
        if (catDiff !== 0) return catDiff;
        return a.visit.ticketNumber - b.visit.ticketNumber;
    });

    const handleAssignComplete = () => {
        setSelectedPatient(null);
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50/50 p-6 lg:p-8 gap-6">
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
    );
}
