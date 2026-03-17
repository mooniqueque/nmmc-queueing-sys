'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from './stats-card';
import React from 'react';
import {
    AlertTriangle,
    Clock,
    Users,
    TrendingUp
} from "lucide-react";
import dynamic from 'next/dynamic';
import { AdminHeader } from "@/components/layouts/admin-header";
import { SessionUser } from "@/types/auth";
import { getBarChartOptions, getDonutChartOptions } from './triage-chart';
import { VolumeData, CategoryData, DestinationData, TriageActivity, TriageKPIs } from '../types';


const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TriageNurseStatsProps {
    volumeData?: VolumeData[];
    categoryData?: CategoryData[];
    destinationData?: DestinationData[];
    recentActivities?: TriageActivity[];
    kpis?: TriageKPIs;
    totalPatients?: number;
}

const DEFAULT_VOLUME_DATA: VolumeData[] = [
    { time: '08:00', patients: 12 }, { time: '09:00', patients: 25 },
    { time: '10:00', patients: 32 }, { time: '11:00', patients: 28 },
    { time: '12:00', patients: 15 }, { time: '13:00', patients: 22 },
    { time: '14:00', patients: 30 }, { time: '15:00', patients: 18 },
    { time: '16:00', patients: 10 },
];

const DEFAULT_CATEGORY_DATA: CategoryData[] = [
    { name: 'Emergency', value: 8, color: '#ef4444' }, // red-500
    { name: 'Urgent', value: 35, color: '#eab308' },  // yellow-500
    { name: 'Non-Urgent', value: 65, color: '#10b981' }, // emerald-500
];


const DEFAULT_KPIS: TriageKPIs = {
    totalTriagedToday: 108,
    totalTriagedChangePct: 12,
    emergentCases: 8,
    avgTriageTimeMins: 4.2,
    avgTriageTimeChangeMins: -0.5,
    currentlyWaiting: 15
};



export default function TriageNurseStats({
    loggedInUser,
    volumeData = DEFAULT_VOLUME_DATA,
    categoryData = DEFAULT_CATEGORY_DATA,
    kpis = DEFAULT_KPIS,
}: TriageNurseStatsProps & {
    loggedInUser?: SessionUser
}) {
    if (!loggedInUser) return null;
    const barChartSeries = [{
        name: 'Patients',
        data: volumeData.map(d => d.patients)
    }];
    const donutChartSeries = categoryData.map(d => d.value);

    return (
        <div className="flex flex-1 flex-col">
            {/* HEADER */}
            <AdminHeader 
                user={loggedInUser} 
                title="Triage Statistics" 
            />

            <main className="flex-1 p-6 lg:p-10 space-y-8">
                {/* TOP KPI STATS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        label="Total Triaged Today"
                        value={kpis.totalTriagedToday.toString()}
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
                        label="Avg Triage Time"
                        value={`${kpis.avgTriageTimeMins}m`}
                        icon={<TrendingUp size={24} />}
                        color="bg-blue-500/10 text-blue-600"
                    />
                    <StatsCard
                        label="Emergent Cases"
                        value={kpis.emergentCases.toString()}
                        icon={<AlertTriangle size={24} />}
                        color="bg-red-500/10 text-red-600"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Patient Volume Bar Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Patient Volume Today</CardTitle>
                            <CardDescription>Hourly breakdown of arriving patients</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full pt-4">
                                <Chart
                                    options={getBarChartOptions(volumeData)}
                                    series={barChartSeries}
                                    type="bar"
                                    height={300}
                                    width="100%"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Triage Categories Donut Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Triage Categories</CardTitle>
                            <CardDescription>Distribution of patient urgency</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center">
                            <div className="h-[300px] w-full max-w-[400px] pt-4">
                                <Chart
                                    options={getDonutChartOptions(categoryData)}
                                    series={donutChartSeries}
                                    type="donut"
                                    height={300}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

