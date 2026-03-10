'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from './stats-card';
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import React from 'react';
import {
    Activity,
    AlertTriangle,
    Clock,
    Users,
    TrendingUp,
    HeartPulse,
    UserCheck,
    Stethoscope,
    LucideIcon
} from "lucide-react";
import dynamic from 'next/dynamic';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SessionUser } from "@/types/auth";
import { getBarChartOptions, getDonutChartOptions } from './triage-chart';


const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { ApexOptions } from 'apexcharts';

export interface VolumeData {
    time: string;
    patients: number;
}

export interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export interface DestinationData {
    name: string;
    value: number;
    color: string;
}

export interface TriageActivity {
    id: string;
    time: string;
    patient: string;
    type: 'Emergency' | 'Urgent' | 'Non-Urgent';
}

export interface TriageKPIs {
    totalTriagedToday: number;
    totalTriagedChangePct: number;
    emergentCases: number;
    avgTriageTimeMins: number;
    avgTriageTimeChangeMins: number;
    currentlyWaiting: number;
}

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

const DEFAULT_DESTINATION_DATA: DestinationData[] = [
    { name: 'ER', value: 12, color: '#ef4444' },
    { name: 'OPD - Internal Med', value: 45, color: '#3b82f6' },
    { name: 'OPD - Pediatrics', value: 32, color: '#8b5cf6' },
    { name: 'OPD - Surgery', value: 19, color: '#f97316' },
];

const DEFAULT_ACTIVITIES: TriageActivity[] = [
    { id: 'TRG-0108', time: '10 mins ago', patient: 'J. Doe', type: 'Urgent' },
    { id: 'TRG-0107', time: '15 mins ago', patient: 'M. Smith', type: 'Non-Urgent' },
    { id: 'TRG-0106', time: '22 mins ago', patient: 'A. Johnson', type: 'Emergency' },
    { id: 'TRG-0105', time: '30 mins ago', patient: 'R. Davis', type: 'Non-Urgent' },
];

const DEFAULT_KPIS: TriageKPIs = {
    totalTriagedToday: 108,
    totalTriagedChangePct: 12,
    emergentCases: 8,
    avgTriageTimeMins: 4.2,
    avgTriageTimeChangeMins: -0.5,
    currentlyWaiting: 15
};

const getActivityConfig = (type: TriageActivity['type']): { icon: LucideIcon, colorClass: string, badgeClass: string } => {
    switch (type) {
        case 'Emergency':
            return { icon: Activity, colorClass: 'bg-red-100 text-red-600', badgeClass: 'bg-red-50 text-red-700 border border-red-200' };
        case 'Urgent':
            return { icon: AlertTriangle, colorClass: 'bg-yellow-100 text-yellow-600', badgeClass: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };
        case 'Non-Urgent':
        default:
            return { icon: UserCheck, colorClass: 'bg-emerald-100 text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    }
};


export default function TriageNurseStats({
    loggedInUser,
    volumeData = DEFAULT_VOLUME_DATA,
    categoryData = DEFAULT_CATEGORY_DATA,
    destinationData = DEFAULT_DESTINATION_DATA,
    recentActivities = DEFAULT_ACTIVITIES,
    kpis = DEFAULT_KPIS,
    totalPatients = 108
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
            {/*HEADER*/}
            <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-black">Triage Statistics</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="hidden sm:flex sm:flex-col items-end mr-1">
                        <span className="text-sm font-bold text-black">{loggedInUser.name}</span>
                        <span className="text-xs text-black font-medium uppercase tracking-tighter">{loggedInUser.role}</span>
                    </div>
                    <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50'>
                        <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                            {loggedInUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className='p-6 space-y-6 bg-slate-50/50 px-10'>
                {/* TOP KPI STATS ROW */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                    <StatsCard
                        label="Total Triaged Today"
                        value={kpis.totalTriagedToday.toString()}
                        icon={<Users size={28} className="text-white" />}
                        color="bg-emerald-600"
                    />
                    <StatsCard
                        label="Currently Waiting"
                        value={kpis.currentlyWaiting.toString()}
                        icon={<Clock size={28} className="text-white" />}
                        color="bg-amber-500"
                    />
                    <StatsCard
                        label="Avg Triage Time (min)"
                        value={kpis.avgTriageTimeMins.toString()}
                        icon={<TrendingUp size={28} className="text-white" />}
                        color="bg-blue-500"
                    />
                    <StatsCard
                        label="Emergent Cases"
                        value={kpis.emergentCases.toString()}
                        icon={<AlertTriangle size={28} className="text-white" />}
                        color="bg-red-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Patient Volume Bar Chart */}
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-800">Patient Volume Today</CardTitle>
                            <CardDescription>Hourly breakdown of arriving patients</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full mt-4">
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
                    <Card className="shadow-sm border-0 ring-1 ring-slate-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-slate-800">Triage Categories</CardTitle>
                            <CardDescription>Distribution of patient urgency</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center">
                            <div className="h-[300px] w-full max-w-[400px] mt-4">
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

