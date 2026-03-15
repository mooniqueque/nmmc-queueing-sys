"use client";

import { Input } from "@/components/ui/input";
import { VisitWithPatient } from "@/features/triage/types";
import { CheckCircle, Clock, MagnifyingGlass, Funnel, ArrowClockwise, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { calculateAge } from "@/lib/utils";

export type QueueCategory = "ALL" | "PRIORITY" | "REGULAR" | "NO_SHOW";

export interface QueueItem {
    visit: VisitWithPatient;
    category: Exclude<QueueCategory, "ALL">;
    badges: string[];
}

interface ReleasingQueueTableProps {
    items: QueueItem[];
    counts: Record<QueueCategory, number>;
    activeTab: QueueCategory;
    onTabChange: (tab: QueueCategory) => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    selectedPatientId: string | undefined;
    onSelectPatient: (patient: VisitWithPatient) => void;
    isPanelOpen?: boolean;
}

const TABS: { key: QueueCategory; label: string; color: string; activeBg: string; activeText: string }[] = [
    { key: "ALL", label: "All Patients", color: "text-slate-500 hover:text-slate-800", activeBg: "bg-slate-600", activeText: "text-white" },
    { key: "PRIORITY", label: "Priority", color: "text-slate-500 hover:text-amber-600", activeBg: "bg-amber-500", activeText: "text-white" },
    { key: "REGULAR", label: "Regular", color: "text-slate-500 hover:text-emerald-600", activeBg: "bg-emerald-500", activeText: "text-white" },
    { key: "NO_SHOW", label: "No Show", color: "text-slate-500 hover:text-rose-600", activeBg: "bg-rose-500", activeText: "text-white" },
];

export function ReleasingQueueTable({
    items,
    counts,
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
    selectedPatientId,
    onSelectPatient,
    isPanelOpen
}: ReleasingQueueTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Adjust this number as needed

    // Reset page to 1 when tab changes or search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative ">

            {/* Split Top Header - Matches Reference closely */}
            <div className="bg-white shrink-0">
                {/* Header 1: Title and global search */}
                <div className="border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center px-6 lg:px-8 py-5 gap-4">
                    <div>
                        <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Pending Referral Queue</h2>
                        <p className="text-sm text-slate-500 font-medium">
                            Currently <strong className="text-emerald-600 mx-1">{counts.ALL}</strong> patients waiting for verification
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} weight="bold" />
                            <Input
                                placeholder="Search by patient name or ticket no..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 h-10 w-full bg-slate-50/50 border-slate-200 text-[13px] font-semibold rounded-md focus-visible:ring-emerald-500"
                            />
                        </div>
                        <button className="h-10 px-4 shrink-0 flex items-center justify-center gap-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 font-bold text-[13px] transition-colors shadow-sm">
                            <Funnel size={16} weight="bold" /> Filter
                        </button>
                        <button className="h-10 w-10 shrink-0 flex items-center justify-center border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
                            <ArrowClockwise size={16} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Header 2: Pill Tabs */}
                <div className="border-b border-slate-100 px-6 lg:px-8 py-3 flex gap-2">
                    <div className="flex p-1 bg-slate-100/80 rounded-lg border border-slate-200/50">
                        {TABS.map(tab => {
                            const count = counts[tab.key];
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => onTabChange(tab.key)}
                                    className={`relative flex items-center gap-2 px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all duration-300 ${isActive
                                        ? `${tab.activeBg} ${tab.activeText} shadow-md shadow-black/5`
                                        : `bg-transparent ${tab.color}`
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] leading-none transition-colors ${isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table Header (Borderless, pure text) */}
            <div className={`grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px]" : "grid-cols-[70px_1fr_1fr_120px]"} gap-6 px-6 lg:px-8 py-4 bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 border-b border-slate-100`}>
                <div>#Queue</div>
                <div>Patient Name</div>
                {!isPanelOpen && <div>Chief Complaint</div>}
                <div className="text-right">Wait Time</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
                        <CheckCircle size={48} className="mb-4 opacity-20" weight="duotone" />
                        <p className="text-xl font-bold">Queue is empty</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {paginatedItems.map(({ visit, category, badges }) => {
                            const isSelected = selectedPatientId === visit.id;

                            // Wait time calc
                            const waitMins = Math.floor((new Date().getTime() - new Date(visit.createdAt).getTime()) / 60000);
                            const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins} mins`;
                            const isWaitingLong = waitMins > 10;
                            const isWaitingExtreme = waitMins > 30;

                            const waitColorClasses = isWaitingExtreme
                                ? "bg-red-100/80 text-red-600 border border-red-200 shadow-sm"
                                : isWaitingLong
                                    ? "bg-amber-100/80 text-amber-700 border border-amber-200 shadow-sm"
                                    : "bg-slate-100 text-slate-500 border border-slate-200/50";

                            return (
                                <button
                                    key={visit.id}
                                    onClick={() => onSelectPatient(visit)}
                                    className={`w-full text-left grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px]" : "grid-cols-[70px_1fr_1fr_120px]"} gap-6 items-center px-6 lg:px-8 py-4 transition-all duration-200 cursor-pointer min-h-[72px] border-b outline-none relative hover:-translate-y-[1px] ${isSelected
                                        ? "bg-emerald-50/40 border-emerald-200 z-10 hover:bg-emerald-50 shadow-[inset_4px_0_0_#10b981]"
                                        : "bg-white border-slate-100 hover:shadow-md hover:z-10 hover:border-slate-200"
                                        }`}
                                >
                                    {/* Ticket (e.g. #082) */}
                                    <div className={`text-[15px] font-black transition-colors ${isSelected ? 'text-emerald-600' : 'text-emerald-500/80'}`}>
                                        #{visit.ticketNumber.toString().padStart(3, '0')}
                                    </div>

                                    {/* Name & Demographics */}
                                    <div className="min-w-0 pr-4 flex flex-col justify-center">
                                        <div className={`font-black text-[14px] leading-tight truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                                            {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                            {visit.patient.gender.substring(0, 1)}, {calculateAge(visit.patient.dateOfBirth)}y
                                            <span className="opacity-50 mx-0.5">•</span>
                                            <span className="uppercase text-[9px] font-black tracking-widest px-1 py-0.5 bg-slate-100 rounded border border-slate-200">{category}</span>
                                            {visit.status === 'IN_PROGRESS' && (
                                                <span className="uppercase text-[9px] font-black tracking-widest px-1 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded animate-pulse">
                                                    CALLED
                                                </span>
                                            )}
                                            {visit.status === 'NO_SHOW' && (
                                                <span className="uppercase text-[9px] font-black tracking-widest px-1 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded">
                                                    NO-SHOW
                                                </span>
                                            )}
                                            {badges.map(b => (
                                                <span key={b} className="uppercase text-[9px] font-black tracking-widest px-1 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                                                    {b}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chief Complaint (Hidden if Panel Open) */}
                                    {!isPanelOpen && (
                                        <div className="font-medium text-[13px] text-slate-600 italic line-clamp-1 pr-4">
                                            {visit.chiefComplaint || "-"}
                                        </div>
                                    )}

                                    {/* Wait Time Indicator */}
                                    <div className="flex items-center justify-end">
                                        <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full text-[11px] ${waitColorClasses}`}>
                                            <Clock size={12} weight="bold" />
                                            {waitStr}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            {items.length > 0 && (
                <div className="border-t border-slate-100 p-4 bg-white flex items-center justify-between shrink-0">
                    <div className="text-xs font-bold text-slate-500">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length} entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <CaretLeft size={16} weight="bold" />
                        </button>
                        <div className="text-xs font-bold text-slate-700 mx-2">
                            Page {currentPage} of {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <CaretRight size={16} weight="bold" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
