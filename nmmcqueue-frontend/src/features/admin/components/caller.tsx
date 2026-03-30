'use client';

import { useState } from 'react';
import { AdminHeader } from "@/components/layouts/admin-header";
import { StatsCard } from './stats-card';
import { SessionUser } from '@/types/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalytics } from "@/features/shared/hooks/use-analytics";
import {
    HourlyVolumeChart,
    ClassificationPieChart,
    DepartmentBarChart,
    StatusDistributionChart,
} from "@/features/shared/components/analytics-charts";
import { HistoryTable } from "@/features/shared/components/history-table";
import { cn } from '@/lib/utils';
import {
    SpeakerHigh,
    Users,
    Clock,
    XCircle,
    TrendUp,
} from '@phosphor-icons/react';

export default function CallerDashboard({
    loggedInUser,
    departments = [],
}: {
    loggedInUser: SessionUser;
    departments: string[];
    queueOptionsByDepartment?: Record<string, string[]>;
    initialQueue?: unknown[];
}) {
    const [departmentId, setDepartmentId] = useState("ALL");
    const { data, isLoading } = useAnalytics("clinic", departmentId);
    const { kpis } = data;

    return (
        <div className="flex flex-1 flex-col bg-background">
            <AdminHeader user={loggedInUser} title="Clinic Caller Analytics" />

            <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
                {/* Filter */}
                <div className="flex items-center justify-between">
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                        <SelectTrigger className="w-52 h-9">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">General Statistics</SelectItem>
                            {departments.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <div className={cn("size-2 rounded-full", isLoading ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                            {isLoading ? "Syncing..." : "Live"}
                        </p>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatsCard
                        label="Total Called"
                        value={kpis.totalToday.toString()}
                        icon={<SpeakerHigh size={24} weight="fill" />}
                        color="bg-primary text-primary-foreground"
                    />
                    <StatsCard
                        label="Waiting"
                        value={kpis.currentlyWaiting.toString()}
                        icon={<Users size={24} weight="fill" />}
                        color="bg-amber-500/10 text-amber-600"
                    />
                    <StatsCard
                        label="Avg Service"
                        value={`${kpis.avgProcessingMinutes}m`}
                        icon={<Clock size={24} weight="bold" />}
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        label="No Shows"
                        value={kpis.noShowCount.toString()}
                        icon={<XCircle size={24} weight="fill" />}
                        color="bg-red-500/10 text-red-600"
                    />
                    <StatsCard
                        label="Peak Hour"
                        value={kpis.peakHourLabel}
                        icon={<TrendUp size={24} weight="bold" />}
                        color="bg-violet-500/10 text-violet-600"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HourlyVolumeChart data={data.hourlyVolume} />
                    <ClassificationPieChart data={data.classificationBreakdown} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DepartmentBarChart data={data.departmentBreakdown} />
                    <StatusDistributionChart data={data.statusDistribution} />
                </div>

                {/* Recent History */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 max-h-80 overflow-y-auto custom-scrollbar">
                        <HistoryTable items={data.recentHistory} />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}