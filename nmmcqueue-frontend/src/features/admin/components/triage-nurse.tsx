'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ClassificationPieChart, HourlyVolumeChart, StatusDistributionChart } from "@/features/shared/components/analytics-charts";
import { HistoryTable } from "@/features/shared/components/history-table";
import { useAnalytics } from "@/features/shared/hooks/use-analytics";
import { AdminHeader } from "@/shared/layouts";
import { cn } from "@/shared/lib/utils";
import { SessionUser } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { Clock, TrendUp, Users, Warning } from "@phosphor-icons/react";
import { useState } from "react";
import { StatsCard } from './stats-card';

export default function TriageNurseStats({
    loggedInUser,
    departments = [],
}: {
    loggedInUser?: SessionUser;
    departments?: Department[];
}) {
    const [departmentId, setDepartmentId] = useState("ALL");
    const { data, isLoading } = useAnalytics("triage", departmentId);

    if (!loggedInUser) return null;

    const { kpis } = data;

    return (
        <div className="flex flex-1 flex-col">
            <AdminHeader user={loggedInUser} title="Triage Statistics" />

            <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
                {/* Filter Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full", isLoading ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {isLoading ? "Syncing..." : "Live"}
                        </p>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Triaged Today"
                        value={kpis.totalToday.toString()}
                        icon={<Users size={24} />}
                        color="bg-primary text-primary-foreground"
                    />
                    <StatsCard
                        label="Currently Waiting"
                        value={kpis.currentlyWaiting.toString()}
                        icon={<Clock size={24} />}
                        color="bg-amber-500/10 text-amber-600"
                    />
                    <StatsCard
                        label="Avg Processing"
                        value={`${kpis.avgProcessingMinutes}m`}
                        icon={<TrendUp size={24} />}
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        label="No Shows"
                        value={kpis.noShowCount.toString()}
                        icon={<Warning size={24} />}
                        color="bg-red-500/10 text-red-600"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HourlyVolumeChart data={data.hourlyVolume} />
                    <ClassificationPieChart data={data.classificationBreakdown} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StatusDistributionChart data={data.statusDistribution} />
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
