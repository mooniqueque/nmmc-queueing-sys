"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDatePicker } from "@/features/shared/components/operational-report-panel";
import { Clock } from "@phosphor-icons/react";
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
        <Card className="h-full border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground">
                            Upcoming Queue
                        </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary/30">
                        Triage
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
                    <TabsList className="flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 border border-border p-1">
                        <TabsTrigger
                            value="ACTIVE"
                            disabled={isLocked}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-primary"
                        >
                            <span className="truncate">Active Queue</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-gray-600 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                                {activeQueue.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="NO_SHOW"
                            disabled={isLocked}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-background data-[state=active]:text-emerald-600"
                        >
                            <span className="truncate">No Show</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-gray-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
                                {noShowQueue.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="REPORTS"
                            disabled={isLocked}
                            className="rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide data-[state=active]:bg-background"
                        >
                            Reports
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ACTIVE" className="mt-4 focus-visible:outline-none">
                        <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 custom-scrollbar">
                            {activeQueue.length === 0 ? (
                                <EmptyQueueState label="No active patients" />
                            ) : (
                                activeQueue.map((visit) => (
                                    <QueueCard key={visit.id} visit={visit} nowMs={nowMs} />
                                ))
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="NO_SHOW" className="mt-4 focus-visible:outline-none">
                        <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 custom-scrollbar">
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
                    </TabsContent>

                    <TabsContent value="REPORTS" className="mt-4 focus-visible:outline-none">
                        <div className="space-y-4">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                Reports Filter
                            </div>
                            <ReportDatePicker value={reportDate} onChange={setReportDate} />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
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
        <div className="rounded-lg border border-border/50 bg-background p-3 shadow-sm flex items-start justify-between gap-3 transition-colors hover:bg-muted/30 cursor-pointer">
            <div className="min-w-0">
                <div className="text-sm font-medium uppercase tracking-wider text-gray-700">
                    {visit.triageTicket ? `#${visit.triageTicket}` : "#"}
                </div>
                <div className="text-lg font-extrabold text-gray-900 leading-snug break-words">
                    {visit.patient.lastName}, {visit.patient.firstName}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-sm font-medium text-gray-700 bg-muted/40 border-border/60 px-2 py-0.5 whitespace-nowrap">
                    <Clock size={12} weight="bold" /> {waitStr}
                </Badge>
                {action}
            </div>
        </div>
    );
}

function EmptyQueueState({ label }: { label: string }) {
    return (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        </div>
    );
}
