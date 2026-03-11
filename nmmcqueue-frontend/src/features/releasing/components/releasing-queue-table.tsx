"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { WarningCircle, Clock, CheckCircle } from "@phosphor-icons/react";

type QueueCategory = "ALL" | "URGENT" | "PRIORITY" | "REGULAR";

interface QueueItem {
    visit: VisitWithPatient;
    category: Exclude<QueueCategory, "ALL">;
    badges: string[];
}

interface ReleasingQueueTableProps {
    items: QueueItem[];
    counts: Record<QueueCategory, number>;
    activeTab: QueueCategory;
    onTabChange: (tab: QueueCategory) => void;
    selectedPatientId: string | undefined;
    onSelectPatient: (patient: VisitWithPatient) => void;
}

const TABS: { key: QueueCategory; label: string; color: string; activeBg: string; activeText: string }[] = [
    { key: "ALL", label: "All Patients", color: "text-slate-500 hover:text-slate-800", activeBg: "bg-slate-900", activeText: "text-white" },
    { key: "URGENT", label: "Urgent", color: "text-slate-500 hover:text-rose-600", activeBg: "bg-rose-500", activeText: "text-white" },
    { key: "PRIORITY", label: "Priority", color: "text-slate-500 hover:text-amber-600", activeBg: "bg-amber-500", activeText: "text-white" },
    { key: "REGULAR", label: "Regular", color: "text-slate-500 hover:text-emerald-600", activeBg: "bg-emerald-500", activeText: "text-white" },
];

export function ReleasingQueueTable({
    items,
    counts,
    activeTab,
    onTabChange,
    selectedPatientId,
    onSelectPatient,
}: ReleasingQueueTableProps) {
    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header & Tabs */}
            <div className="bg-white shrink-0">
                <div className="px-8 py-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Window Queue</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1 inline-flex items-center gap-1.5">
                            <Clock size={16} /> Wait times calculated from Kiosk entry
                        </p>
                    </div>
                    
                    {/* Premium Pill Tabs */}
                    <div className="flex p-1 bg-slate-100/80 rounded-full border border-slate-200/50">
                        {TABS.map(tab => {
                            const count = counts[tab.key];
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => onTabChange(tab.key)}
                                    className={`relative flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                                        isActive 
                                            ? `${tab.activeBg} ${tab.activeText} shadow-md shadow-black/5` 
                                            : `bg-transparent ${tab.color}`
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] leading-none transition-colors ${
                                        isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table Header (Borderless, soft) */}
            <div className="grid grid-cols-[80px_1fr_120px_220px_160px] gap-6 px-8 py-3 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest shrink-0 border-y border-slate-100">
                <div className="text-center">Ticket</div>
                <div>Patient</div>
                <div>Age / Gender</div>
                <div>Queue Flags</div>
                <div className="text-right">Wait Time</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 custom-scrollbar relative">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
                        <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                        <p className="text-xl font-medium">Queue is empty</p>
                        <p className="text-sm mt-2 text-slate-500">No patients waiting in {TABS.find(t => t.key === activeTab)?.label} category.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {items.map(({ visit, category, badges }) => {
                            const isSelected = selectedPatientId === visit.id;
                            
                            // Category subtle indicators
                            const catColors = {
                                URGENT: "bg-rose-50",
                                PRIORITY: "bg-amber-50",
                                REGULAR: "bg-emerald-50"
                            }[category];

                            // Wait time calc
                            const waitMins = Math.floor((new Date().getTime() - new Date(visit.createdAt).getTime()) / 60000);
                            const waitStr = waitMins > 60 ? `${Math.floor(waitMins/60)}h ${waitMins%60}m` : `${waitMins}m`;
                            const isWaitingLong = waitMins > 30;

                            return (
                                <button
                                    key={visit.id}
                                    onClick={() => onSelectPatient(visit)}
                                    className={`w-full text-left grid grid-cols-[80px_1fr_120px_220px_160px] gap-6 items-center px-4 py-4 rounded-xl transition-all duration-200 cursor-pointer min-h-[76px] relative group ${
                                        isSelected 
                                            ? "bg-white ring-2 ring-emerald-500 shadow-md shadow-emerald-500/10 z-10" 
                                            : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    {/* Subtle category dot indicator instead of massive border */}
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full transition-opacity ${
                                        category === "URGENT" ? "bg-rose-500" :
                                        category === "PRIORITY" ? "bg-amber-500" : 
                                        "bg-emerald-500 opacity-50"
                                    }`} />

                                    {/* Ticket */}
                                    <div className="text-center pl-2">
                                        <div className={`text-2xl font-black ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>
                                            {visit.ticketNumber}
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="font-bold text-[17px] text-slate-800 uppercase tracking-tight truncate pr-4">
                                        {visit.patient.lastName}, <span className="opacity-75">{visit.patient.firstName}</span>
                                    </div>

                                    {/* Age & Gender */}
                                    <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded-md">{visit.patient.age}y</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{visit.patient.gender}</span>
                                    </div>

                                    {/* Flags */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {category === "URGENT" && (
                                            <span className="flex items-center gap-1 bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded text-[10px] uppercase">
                                                <WarningCircle weight="bold" /> Urgent
                                            </span>
                                        )}
                                        {badges.map(b => (
                                            <span key={b} className="bg-amber-100/80 text-amber-800 font-bold px-2 py-1 rounded text-[10px] uppercase border border-amber-200/50">
                                                {b}
                                            </span>
                                        ))}
                                        {badges.length === 0 && category !== "URGENT" && (
                                            <span className="text-slate-400 text-sm font-medium italic">None</span>
                                        )}
                                    </div>

                                    {/* Wait Time */}
                                    <div className="flex items-center justify-end gap-2 text-sm">
                                        <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full ${
                                            isWaitingLong 
                                                ? "bg-rose-50 text-rose-600" 
                                                : "bg-slate-50 text-slate-600"
                                        }`}>
                                            <Clock size={14} weight="bold" />
                                            {waitStr}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
