"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { Department } from "@/types/models";
import { useState } from "react";
import { useReleasingQueue } from "../hooks";
import { ReleasingQueueTable } from "./releasing-queue-table";
import { ReleasingAssignPanel } from "./releasing-assign-panel";

// ─── Auto-categorization logic ────────────────────────────────
type QueueCategory = "ALL" | "URGENT" | "PRIORITY" | "REGULAR";

function categorizeVisit(visit: VisitWithPatient): Exclude<QueueCategory, "ALL"> {
    // URGENT: infectious cases, ER referral disposition
    if (visit.isInfectious) return "URGENT";
    if (visit.disposition?.toUpperCase().includes("ER")) return "URGENT";

    // PRIORITY: has appointment, children (<12), seniors (>=60)
    if (visit.hasAppointment) return "PRIORITY";
    if (visit.patient.age < 12 || visit.patient.age >= 60) return "PRIORITY";

    return "REGULAR";
}

function getCategoryBadges(visit: VisitWithPatient): string[] {
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

    // Categorize each visit
    const categorized = activeQueue.map(visit => ({
        visit,
        category: categorizeVisit(visit),
        badges: getCategoryBadges(visit),
    }));

    // Counts
    const counts = {
        ALL: categorized.length,
        URGENT: categorized.filter(c => c.category === "URGENT").length,
        PRIORITY: categorized.filter(c => c.category === "PRIORITY").length,
        REGULAR: categorized.filter(c => c.category === "REGULAR").length,
    };

    // Filter
    const filtered = activeTab === "ALL"
        ? categorized
        : categorized.filter(c => c.category === activeTab);

    // Sort: within each view, URGENT first, then PRIORITY, then REGULAR, then by ticket number
    const sorted = [...filtered].sort((a, b) => {
        const order: Record<string, number> = { URGENT: 0, PRIORITY: 1, REGULAR: 2 };
        const catDiff = (order[a.category] ?? 2) - (order[b.category] ?? 2);
        if (catDiff !== 0) return catDiff;
        return a.visit.ticketNumber - b.visit.ticketNumber;
    });

    const handleAssignComplete = () => {
        setSelectedPatient(null);
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50/50">
            {/* Queue Table (top section — grows to fill available space) */}
            <div className={`flex-1 min-h-0 flex flex-col ${selectedPatient ? "max-h-[55%]" : ""}`}>
                <ReleasingQueueTable
                    items={sorted}
                    counts={counts}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    selectedPatientId={selectedPatient?.id}
                    onSelectPatient={setSelectedPatient}
                />
            </div>

            {/* Assignment Panel (bottom section — appears when selected) */}
            {selectedPatient && (
                <div className="shrink-0 border-t-2 border-emerald-200">
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
