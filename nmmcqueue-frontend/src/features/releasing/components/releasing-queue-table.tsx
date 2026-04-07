"use client";

import { Input } from "@/components/ui/input";
import { VisitWithPatient } from "@/features/triage/types";
import { CheckCircle, Clock, MagnifyingGlass, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { calculateAge } from "@/shared/lib/utils";

export type QueueCategory = "ALL" | "PRIORITY" | "REGULAR" | "NO_SHOW";

interface ReleasingQueueTableProps {
    items: VisitWithPatient[];
    counts: Record<QueueCategory, number>;
    activeTab: QueueCategory;
    onTabChange: (tab: QueueCategory) => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    isPanelOpen?: boolean;
    onRowClick?: (visit: VisitWithPatient) => void;
}

const TABS: { key: QueueCategory; label: string; shortLabel?: string; color: string; activeBg: string; activeText: string }[] = [
    { key: "ALL", label: "All Patients", shortLabel: "All", color: "text-muted-foreground hover:text-foreground", activeBg: "bg-primary", activeText: "text-primary-foreground" },
    { key: "PRIORITY", label: "Priority", color: "text-muted-foreground hover:text-primary", activeBg: "bg-primary/20", activeText: "text-primary" },
    { key: "REGULAR", label: "Regular", color: "text-muted-foreground hover:text-primary", activeBg: "bg-primary/20", activeText: "text-primary" },
    { key: "NO_SHOW", label: "No Show", color: "text-muted-foreground hover:text-destructive", activeBg: "bg-destructive", activeText: "text-destructive-foreground" },
];

export function ReleasingQueueTable({
    items,
    counts,
    activeTab,
    onTabChange,
    searchQuery,
    onSearchChange,
    isPanelOpen,
    onRowClick
}: ReleasingQueueTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">

            {/* Header */}
            <div className="bg-muted/10 shrink-0">
                {/* Title + Search */}
                <div className="border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-6 lg:px-8 py-3 sm:py-5 gap-3 sm:gap-4">
                    <div>
                        <h2 className="text-sm sm:text-lg font-bold text-foreground tracking-tight">Pending Referrals</h2>
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            Currently <strong className="text-primary font-bold mx-0.5">{counts.ALL}</strong> patients waiting
                        </p>
                    </div>

                    <div className="relative w-full sm:w-52 lg:w-72">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} weight="bold" />
                        <Input
                            placeholder="Search patient..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9 h-8 sm:h-9 w-full bg-background border-border text-xs font-medium rounded-lg focus-visible:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center">
                    <div className="flex p-0.5 sm:p-1 bg-muted/50 rounded-lg border border-border overflow-x-auto">
                        {TABS.map(tab => {
                            const count = counts[tab.key];
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => { onTabChange(tab.key); setCurrentPage(1); }}
                                    className={`relative flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-md transition-all duration-200 whitespace-nowrap ${isActive
                                        ? `${tab.activeBg} ${tab.activeText} shadow-sm`
                                        : `bg-transparent ${tab.color}`
                                        }`}
                                >
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                                    {count > 0 && (
                                        <span className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] leading-none transition-colors ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className={`grid ${isPanelOpen ? "grid-cols-[50px_1fr_80px] sm:grid-cols-[60px_1fr_120px]" : "grid-cols-[50px_1fr_80px] sm:grid-cols-[80px_1fr_1fr_120px]"} gap-2 sm:gap-6 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-card text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] shrink-0 border-b border-border`}>
                <div>#Queue</div>
                <div>Patient Name</div>
                {!isPanelOpen && <div className="hidden sm:block">Department</div>}
                <div className="text-right">Wait Time</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 relative custom-scrollbar">
                {paginatedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 sm:p-12">
                        <CheckCircle size={40} className="mb-4 opacity-20" weight="duotone" />
                        <p className="text-base sm:text-xl font-bold">Queue is empty</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {paginatedItems.map((visit) => {
                            const waitMins = Math.floor((new Date().getTime() - new Date(visit.createdAt).getTime()) / 60000);
                            const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins}m`;
                            const isWaitingLong = waitMins > 10;
                            const isWaitingExtreme = waitMins > 30;

                            const waitColorClasses = isWaitingExtreme
                                ? "bg-red-100/80 text-red-600 border border-red-200 shadow-sm"
                                : isWaitingLong
                                    ? "bg-amber-100/80 text-amber-700 border border-amber-200 shadow-sm"
                                    : "bg-slate-100 text-slate-500 border border-slate-200/50";

                            const categoryLabel = visit.classification === 'PRIORITY' ? 'PRIORITY' : 'REGULAR';

                            return (
                                <div
                                    key={visit.id}
                                    onClick={() => onRowClick && onRowClick(visit)}
                                    className={`w-full text-left grid ${isPanelOpen ? "grid-cols-[50px_1fr_80px] sm:grid-cols-[60px_1fr_120px]" : "grid-cols-[50px_1fr_80px] sm:grid-cols-[80px_1fr_1fr_120px]"} gap-2 sm:gap-6 items-center px-3 sm:px-6 lg:px-8 py-3 sm:py-4 transition-all duration-200 min-h-[56px] sm:min-h-[72px] border-b border-border bg-background ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                >
                                    {/* Ticket */}
                                    <div className="text-sm sm:text-base font-bold text-primary/60">
                                        {visit.triageTicket ? `#${visit.triageTicket}` : '—'}
                                    </div>

                                    {/* Name & Demographics */}
                                    <div className="min-w-0 pr-2 flex flex-col justify-center">
                                        <div className="font-bold text-[11px] sm:text-sm leading-tight truncate text-foreground/90">
                                            {visit.patient.lastName}, <span className="text-muted-foreground font-medium">{visit.patient.firstName}</span>
                                        </div>
                                        <div className="text-[9px] sm:text-[10px] font-medium text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap uppercase tracking-wider">
                                            {visit.patient.gender.substring(0, 1)} • {calculateAge(visit.patient.dateOfBirth) ?? '??'}y
                                            <span className="w-1 h-1 rounded-full bg-border hidden sm:block" />
                                            <span className={`font-bold ${visit.classification === 'PRIORITY' ? 'text-destructive' : 'text-emerald-600'}`}>
                                                {categoryLabel}
                                            </span>
                                            {visit.status === 'IN_WINDOW' && (
                                                <span className="px-1 sm:px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md animate-pulse text-[8px] sm:text-[9px]">
                                                    CALLED
                                                </span>
                                            )}
                                            {visit.status === 'NO_SHOW' && (
                                                <span className="px-1 sm:px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-[8px] sm:text-[9px]">
                                                    NO-SHOW
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Department (Hidden if Panel Open or on mobile) */}
                                    {!isPanelOpen && (
                                        <div className="hidden sm:block font-bold text-xs text-muted-foreground line-clamp-1 pr-4">
                                            {visit.department?.name || "—"}
                                        </div>
                                    )}

                                    {/* Wait Time */}
                                    <div className="flex items-center justify-end">
                                        <div className={`flex items-center gap-1 sm:gap-1.5 font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] ${waitColorClasses}`}>
                                            <Clock size={10} weight="bold" className="hidden sm:block" />
                                            {waitStr}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {items.length > 0 && (
                <div className="border-t border-border px-3 sm:px-6 py-3 sm:py-4 bg-muted/10 flex items-center justify-between shrink-0">
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 sm:p-1.5 border border-border rounded-md text-foreground hover:bg-background disabled:opacity-30 transition-all shadow-sm"
                        >
                            <CaretLeft size={12} weight="bold" />
                        </button>
                        <div className="text-[9px] sm:text-[10px] font-bold text-foreground mx-1.5 sm:mx-3">
                            {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 sm:p-1.5 border border-border rounded-md text-foreground hover:bg-background disabled:opacity-30 transition-all shadow-sm"
                        >
                            <CaretRight size={12} weight="bold" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

