"use client";

import { Input } from "@/components/ui/input";
import { VisitWithPatient } from "@/features/triage/types";
import { CheckCircle, Clock, MagnifyingGlass, Funnel, CaretLeft, CaretRight } from "@phosphor-icons/react";
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
    { key: "ALL", label: "All Patients", color: "text-muted-foreground hover:text-foreground", activeBg: "bg-primary", activeText: "text-primary-foreground" },
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
    selectedPatientId,
    onSelectPatient,
    isPanelOpen
}: ReleasingQueueTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8; // Adjust this number as needed

    // Reset page to 1 when tab changes or search query changes
    // Moved to parent to avoid cascading renders

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
    const paginatedItems = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">

            {/* Split Top Header - Matches Reference closely */}
            <div className="bg-muted/10 shrink-0">
                {/* Header 1: Title and global search */}
                <div className="border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center px-6 lg:px-8 py-5 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">Pending Referrals</h2>
                        <p className="text-xs text-muted-foreground font-medium">
                            Currently <strong className="text-primary font-bold mx-0.5">{counts.ALL}</strong> patients waiting
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-72">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} weight="bold" />
                            <Input
                                placeholder="Search patient..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-9 h-9 w-full bg-background border-border text-xs font-medium rounded-lg focus-visible:ring-primary/20"
                            />
                        </div>
                        <button className="h-9 px-3 shrink-0 flex items-center justify-center gap-2 border border-border bg-background rounded-lg hover:bg-muted text-muted-foreground font-bold text-[11px] transition-all shadow-sm">
                            <Funnel size={14} weight="bold" /> Filter
                        </button>
                    </div>
                </div>

                {/* Header 2: Pill Tabs */}
                <div className="border-b border-border px-6 lg:px-8 py-2.5 flex gap-2">
                    <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
                        {TABS.map(tab => {
                            const count = counts[tab.key];
                            const isActive = activeTab === tab.key;
                            return (
                                    <button
                                    key={tab.key}
                                    onClick={() => onTabChange(tab.key)}
                                    className={`relative flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold rounded-md transition-all duration-200 ${isActive
                                        ? `${tab.activeBg} ${tab.activeText} shadow-sm`
                                        : `bg-transparent ${tab.color}`
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] leading-none transition-colors ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
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
            <div className={`grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px]" : "grid-cols-[80px_1fr_1fr_120px]"} gap-6 px-6 lg:px-8 py-3 bg-card text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] shrink-0 border-b border-border`}>
                <div>#Queue</div>
                <div>Patient Name</div>
                {!isPanelOpen && <div>Department</div>}
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
                                    className={`w-full text-left grid ${isPanelOpen ? "grid-cols-[60px_1fr_120px]" : "grid-cols-[80px_1fr_1fr_120px]"} gap-6 items-center px-6 lg:px-8 py-4 transition-all duration-200 cursor-pointer min-h-[72px] border-b border-border outline-none relative hover:bg-muted/5 ${isSelected
                                        ? "bg-primary/3 z-10"
                                        : "bg-background"
                                        }`}
                                >
                                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                    {/* Ticket (e.g. #082) */}
                                    <div className={`text-base font-bold transition-colors ${isSelected ? 'text-primary' : 'text-primary/60'}`}>
                                        #{visit.ticketNumber.toString().padStart(3, '0')}
                                    </div>

                                    {/* Name & Demographics */}
                                    <div className="min-w-0 pr-4 flex flex-col justify-center">
                                        <div className={`font-bold text-sm leading-tight truncate ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                                            {visit.patient.lastName}, <span className="text-muted-foreground font-medium">{visit.patient.firstName}</span>
                                        </div>
                                        <div className="text-[10px] font-medium text-muted-foreground mt-1 flex items-center gap-2 flex-wrap uppercase tracking-wider">
                                            {visit.patient.gender.substring(0, 1)} • {calculateAge(visit.patient.dateOfBirth)}y
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="font-bold text-primary/80">{category}</span>
                                            {visit.status === 'IN_PROGRESS' && (
                                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md animate-pulse">
                                                    CALLED
                                                </span>
                                            )}
                                            {visit.status === 'NO_SHOW' && (
                                                <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md">
                                                    NO-SHOW
                                                </span>
                                            )}
                                            {badges.map(b => (
                                                <span key={b} className="px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded-md">
                                                    {b}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Department (Hidden if Panel Open) */}
                                    {!isPanelOpen && (
                                        <div className="font-bold text-xs text-muted-foreground line-clamp-1 pr-4">
                                            {visit.department?.name || "-"}
                                        </div>
                                    )}

                                    {/* Wait Time Indicator */}
                                    <div className="flex items-center justify-end">
                                        <div className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-[10px] ${waitColorClasses}`}>
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
                <div className="border-t border-border px-6 py-4 bg-muted/10 flex items-center justify-between shrink-0">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of {items.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-border rounded-md text-foreground hover:bg-background disabled:opacity-30 transition-all shadow-sm"
                        >
                            <CaretLeft size={14} weight="bold" />
                        </button>
                        <div className="text-[10px] font-bold text-foreground mx-3">
                            {currentPage} / {totalPages}
                        </div>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 border border-border rounded-md text-foreground hover:bg-background disabled:opacity-30 transition-all shadow-sm"
                        >
                            <CaretRight size={14} weight="bold" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
