"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDatePicker } from "@/features/shared/components/operational-report-panel";
import { Clock } from "@phosphor-icons/react";
import { BarChart2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { TabType } from "../hooks";
import { VisitWithPatient } from "../types";

interface TriageQueueSidebarProps {
    activeQueue: VisitWithPatient[];
    noShowQueue: VisitWithPatient[];
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    isLocked: boolean;
    onCallNoShow: (visitId: string) => void;
    reportDate: string;
    setReportDate: (date: string) => void;
}

export function TriageQueueSidebar({
    activeQueue,
    noShowQueue,
    activeTab,
    setActiveTab,
    isLocked,
    onCallNoShow,
    reportDate,
    setReportDate,
}: TriageQueueSidebarProps) {
    const [nowMs, setNowMs] = useState<number | null>(null);

    useEffect(() => {
        const updateNow = () => setNowMs(Date.now());
        updateNow();
        const intervalId = window.setInterval(updateNow, 60_000);
        return () => window.clearInterval(intervalId);
    }, []);

    return (
        <div className="flex flex-col w-full bg-card rounded-xl border border-border overflow-hidden shrink-0 h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] lg:h-[calc(100vh-48px)]">
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
                        onClick={() => setActiveTab(activeTab === "REPORTS" ? "ACTIVE" : "REPORTS")}
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
                    onClick={() => setActiveTab("ACTIVE")}
                    disabled={isLocked}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                        activeTab === "ACTIVE" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Active Queue ({activeQueue.length})
                    {activeTab === "ACTIVE" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("NO_SHOW")}
                    disabled={isLocked}
                    className={`flex-1 py-3 text-[10px] text-red-800 font-bold uppercase tracking-widest transition-all relative ${
                        activeTab === "NO_SHOW" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    No Shows ({noShowQueue.length})
                    {activeTab === "NO_SHOW" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
                    )}
                </button>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                {activeTab === "ACTIVE" && (
                    <div className="p-4 sm:p-5 space-y-3">
                        {activeQueue.length === 0 ? (
                            <EmptyQueueState label="No active patients" />
                        ) : (
                            activeQueue.map((visit) => (
                                <QueueCard key={visit.id} visit={visit} nowMs={nowMs} />
                            ))
                        )}
                    </div>
                )}
                {activeTab === "NO_SHOW" && (
                    <div className="p-4 sm:p-5 space-y-3">
                        {noShowQueue.length === 0 ? (
                            <EmptyQueueState label="No missed patients" />
                        ) : (
                            noShowQueue.map((visit) => (
                                <QueueCard
                                    key={visit.id}
                                    visit={visit}
                                    nowMs={nowMs}
                                    action={
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onCallNoShow(visit.id)}
                                            className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            Call Patient
                                        </Button>
                                    }
                                />
                            ))
                        )}
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
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm flex items-start justify-between gap-3 transition-colors hover:bg-slate-50 cursor-pointer">
            <div className="min-w-0">
                <div className="text-sm font-medium uppercase tracking-wider text-gray-700">
                    {visit.triageTicket ? `#${visit.triageTicket}` : "#"}
                </div>
                <div className="text-lg font-extrabold text-gray-900 leading-snug break-all">
                    {visit.patient.lastName}, {visit.patient.firstName}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-sm font-medium text-slate-600 bg-slate-50 border-slate-200 px-2 py-0.5 whitespace-nowrap rounded-full">
                    <Clock size={12} weight="bold" /> {waitStr}
                </Badge>
                {action}
            </div>
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
