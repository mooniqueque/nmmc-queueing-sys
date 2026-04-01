"use client";

import {
    Ticket,
    Users,
    ClockCounterClockwise,
    CheckCircle,
} from '@phosphor-icons/react';
import { AdminHeader } from "@/components/layouts/admin-header";
import { StatsCard } from './stats-card';
import { SessionUser } from '@/types/auth';
import { Department } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAnalytics } from "@/features/shared/hooks/use-analytics";
import { HourlyVolumeChart, ClassificationPieChart, DepartmentBarChart } from "@/features/shared/components/analytics-charts";
import { HistoryTable } from "@/features/shared/components/history-table";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WindowReportsDialog } from "./window-reports-dialog";

export default function ReleasingDashboard({
    loggedInUser,
    departments = [],
}: {
    loggedInUser: SessionUser;
    departments: Department[];
}) {
    const [departmentId, setDepartmentId] = useState("ALL");
    const { data, isLoading } = useAnalytics("window", departmentId);
    const { kpis } = data;

    return (
        <div className="flex flex-1 flex-col">
            <AdminHeader user={loggedInUser} title="Releasing Analytics" />

            <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <SearchableSelect
                        options={[
                            { label: "General Statistics", value: "ALL" },
                            ...departments.map(d => ({ label: d.name, value: d.id }))
                        ]}
                        value={departmentId}
                        onSelect={setDepartmentId}
                        placeholder="All Departments"
                        searchPlaceholder="Search department..."
                        className="w-52 h-9"
                    />
                    <div className="flex items-center gap-3">
                        <WindowReportsDialog loggedInUser={loggedInUser} />
                        <div className="flex items-center gap-2 border-l pl-3">
                            <div className={cn("size-2 rounded-full", isLoading ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                {isLoading ? "Syncing..." : "Live"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Released"
                        value={kpis.totalToday.toString()}
                        icon={<Ticket size={24} weight="fill" />}
                        color="bg-primary text-primary-foreground"
                    />
                    <StatsCard
                        label="Waiting at Window"
                        value={kpis.currentlyWaiting.toString()}
                        icon={<Users size={24} weight="fill" />}
                        color="bg-amber-500/10 text-amber-600"
                    />
                    <StatsCard
                        label="Avg Window Time"
                        value={`${kpis.avgProcessingMinutes}m`}
                        icon={<ClockCounterClockwise size={24} weight="bold" />}
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        label="Completed"
                        value={kpis.completedToday.toString()}
                        icon={<CheckCircle size={24} weight="fill" />}
                        color="bg-emerald-500/10 text-emerald-600"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HourlyVolumeChart data={data.hourlyVolume} />
                    <ClassificationPieChart data={data.classificationBreakdown} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DepartmentBarChart data={data.departmentBreakdown} />
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 max-h-72 overflow-y-auto custom-scrollbar">
                            <HistoryTable items={data.recentHistory} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
