"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDatePicker } from "@/features/shared/components/operational-report-panel";
import { VisitWithPatient } from "@/features/triage/types";
import { Clock } from "@phosphor-icons/react";
import { BarChart2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
export type SidebarTab = "ALL" | "NO_SHOW" | "REPORTS";

const isWindowScopedNoShow = (visit: VisitWithPatient) =>
    visit.status === "NO_SHOW" && Boolean(visit.sequenceKey?.startsWith("WINDOW_"));

interface ReleasingQueueSidebarProps {
    items: VisitWithPatient[];
    counts: { ALL: number; NO_SHOW: number;[key: string]: number };
    activeTab: SidebarTab;
    onTabChange: (tab: SidebarTab) => void;
    isLocked: boolean;
    onCallNoShow: (visitId: string) => void;
    reportDate: string;
    setReportDate: (date: string) => void;
}

export function ReleasingQueueSidebar({
    items,
    counts,
    activeTab,
    onTabChange,
    isLocked,
    onCallNoShow,
    reportDate,
    setReportDate,
}: ReleasingQueueSidebarProps) {
    const [nowMs, setNowMs] = useState<number | null>(null);

    useEffect(() => {
        const updateNow = () => setNowMs(Date.now());
        updateNow();
        const intervalId = window.setInterval(updateNow, 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    const renderList = (filterTab: SidebarTab) => {
        if (filterTab === "REPORTS") return null;

        const filteredItems = items.filter(v => {
            if (filterTab === "ALL") return v.status !== "NO_SHOW";
            if (filterTab === "NO_SHOW") return isWindowScopedNoShow(v);
            return v.classification === filterTab && v.status !== "NO_SHOW";
        });

        if (filteredItems.length === 0) {
            return <EmptyQueueState label={`No pending ${filterTab.toLowerCase()} patients`} />;
        }

        return filteredItems.map(visit => (
            <QueueCard
                key={visit.id}
                visit={visit}
                nowMs={nowMs}
                action={
                    visit.status === "NO_SHOW" ? (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCallNoShow(visit.id);
                            }}
                            disabled={isLocked}
                            className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border-xl border-emerald-200 hover:bg-emerald-50"
                        >
                            Call No-Show
                        </Button>
                    ) : undefined
                }
            />
        ));
    };

    return (
        <div className="flex flex-col h-full w-full bg-card rounded-xl border border-border overflow-hidden shrink-0">
            {/* Header */}
            <div className="px-6 py-6 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground uppercase">WaitList</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onTabChange(activeTab === "REPORTS" ? "ALL" : "REPORTS")}
                        className="text-slate-800 font-bold border-orange-200 bg-yellow-100 hover:bg-yellow-50 rounded-lg"
                    >
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Reports
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border bg-background">
                <button
                    onClick={() => onTabChange("ALL")}
                    disabled={isLocked}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === "ALL" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    WaitList ({counts.ALL})
                    {activeTab === "ALL" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange("NO_SHOW")}
                    disabled={isLocked}
                    className={`flex-1 py-3 text-[10px] text-red-800 font-bold uppercase tracking-widest transition-all relative ${activeTab === "NO_SHOW" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    No Shows ({counts.NO_SHOW})
                    {activeTab === "NO_SHOW" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
                    )}
                </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                {activeTab === "ALL" && (
                    <div className="p-4 sm:p-5 space-y-3">
                        {renderList("ALL")}
                    </div>
                )}
                {activeTab === "NO_SHOW" && (
                    <div className="p-4 sm:p-5 space-y-3">
                        {renderList("NO_SHOW")}
                    </div>
                )}
                {activeTab === "REPORTS" && (
                    <div className="p-4 sm:p-5 space-y-4">
                        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Reports Filter
                        </div>
                        <ReportDatePicker value={reportDate} onChange={setReportDate} />
                    </div>
                )}
            </div>
        </div>
    );
}

function QueueCard({
    visit,
    nowMs,
    action,
}: {
    visit: VisitWithPatient;
    nowMs: number | null;
    action?: ReactNode;
}) {
    const createdAtMs = new Date(visit.createdAt).getTime();
    const waitMins = Math.max(0, Math.floor(((nowMs ?? createdAtMs) - createdAtMs) / 60000));
    const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins}m`;

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm flex flex-col gap-2 relative">
            <div className="flex justify-between items-start">
                <div className="text-xl font-extrabold text-foreground leading-snug wrap-anywhere">
                    {visit.patient.lastName}, <span className="font-semibold text-muted-foreground">{visit.patient.firstName}</span>
                </div>
                <Badge variant="outline" className={`font-bold uppercase tracking-wider text-[10px] rounded-full ${visit.classification === 'PRIORITY' ? 'text-rose-600 border-rose-200 bg-rose-50/70' : 'text-emerald-700 border-emerald-200 bg-emerald-50'}`}>
                    {visit.classification === 'PRIORITY' ? 'PRIO' : 'REG'}
                </Badge>
            </div>
            <div className="flex items-center justify-between mt-1">
                <div className="text-sm font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-muted rounded flex items-center justify-center text-foreground font-black text-xs">
                        #
                    </div>
                    {visit.triageTicket || "—"}
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                        <Clock size={12} weight="bold" /> {waitStr}
                    </div>
                </div>
            </div>
            {action && (
                <div className="mt-2 pt-2 border-t border-border flex justify-end">
                    {action}
                </div>
            )}
        </div>
    );
}

function EmptyQueueState({ label }: { label: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</div>
        </div>
    );
}

