"use client";

import { VisitWithPatient } from "@/app/(staffs)/triage/_types";
import { useState } from "react";
import { useReleasingQueue } from "../hooks";

const QUEUE_TABS = [
    { key: "ALL", label: "All" },
    { key: "REGNEW", label: "Regular" },
    { key: "PRIORITY", label: "Priority" },
] as const;

type TabKey = (typeof QUEUE_TABS)[number]["key"];

interface ReleasingQueueSidebarProps {
    initialQueue: VisitWithPatient[];
    selectedPatientId: string | undefined;
    onSelectPatient: (patient: VisitWithPatient | null) => void;
    onError: (err: string) => void;
}

export function ReleasingQueueSidebar({
    initialQueue,
    selectedPatientId,
    onSelectPatient,
    onError
}: ReleasingQueueSidebarProps) {
    const { activeQueue } = useReleasingQueue(initialQueue);
    const [activeTab, setActiveTab] = useState<TabKey>("ALL");

    // Filter the queue based on the active tab
    const filteredQueue = activeQueue.filter((visit: VisitWithPatient) => {
        if (activeTab === "ALL") return true;
        return visit.priorityClass === activeTab;
    });

    // Count per tab for the badges
    const countFor = (tab: TabKey) => {
        if (tab === "ALL") return activeQueue.length;
        return activeQueue.filter((v: VisitWithPatient) => v.priorityClass === tab).length;
    };

    return (
        <div className="w-80 h-full flex flex-col bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden shrink-0">
            <div className="p-4 bg-emerald-900 border-b border-emerald-800 flex justify-between items-center shrink-0">
                <h2 className="font-bold text-white tracking-wide">WAITING FOR WINDOW</h2>
            </div>

            {/* Tab bar */}
            <div className="flex bg-emerald-800 shrink-0 overflow-x-auto">
                {QUEUE_TABS.map((tab) => {
                    const count = countFor(tab.key);
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2.5 text-[10px] font-bold transition-colors text-center uppercase whitespace-nowrap px-1 ${isActive
                                ? "bg-emerald-700 text-white border-b-2 border-emerald-300"
                                : "text-emerald-200 hover:bg-emerald-700/50 hover:text-white border-b-2 border-transparent"
                                }`}
                        >
                            {tab.label} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-3 pointer-events-auto bg-slate-50 relative px-3 py-3">
                {filteredQueue.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 text-sm font-medium">No patients in this category.</div>
                ) : (
                    filteredQueue.map((visit: VisitWithPatient) => (
                        <div
                            key={visit.id}
                            onClick={() => {
                                onError("");
                                onSelectPatient(visit);
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all shadow-sm flex flex-col gap-2 ${selectedPatientId === visit.id
                                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20"
                                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                                    {visit.patient.lastName}, {visit.patient.firstName}
                                </span>
                                {visit.priorityClass && visit.priorityClass !== "REGNEW" && (
                                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                                        {visit.priorityClass}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>Ticket: <strong className="text-emerald-700">{visit.ticketNumber}</strong></span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
