"use client";

import {
    Ticket,
    Users,
    ClockCounterClockwise,
    CheckCircle,
} from '@phosphor-icons/react';
import { VisitWithPatient } from '@/features/triage/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatsCard } from './stats-card';
import { SessionUser } from '@/types/auth';
import { Department } from '@/types/models';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function ReleasingDashboard({
    loggedInUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    departments = [],
}: {
    loggedInUser: SessionUser;
    departments: Department[];
    initialQueue?: VisitWithPatient[];
    queueOptionsByDepartment?: Record<string, string[]>;
}) {
    // MOCK DATA for Admin Statistics view
    const kpis = {
        totalTicketsReleased: 124,
        totalWaitingPatients: 42,
        peakWaitingDepartment: "Animal Bite",
        resolvedTickets: 89
    };

    return (
        <div className='flex flex-1 flex-col h-full'>
            {/* HEADER */}
            <header className='bg-white sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-emerald-900">Releasing Analytics</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="flex flex-col items-end mr-1 sm:flex">
                        <span className="text-sm font-bold text-emerald-900">
                            {loggedInUser.name}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-tighter">{loggedInUser.role.replace('_', ' ')}</span>
                    </div>

                    <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50'>
                        <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                            {loggedInUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10 overflow-y-auto'>
                <Tabs defaultValue="statistics" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-emerald-800">Releasing Dashboard</h2>
                            <p className="text-sm text-muted-foreground">Manage tickets and view department analytics</p>
                        </div>
                        <TabsList className="bg-emerald-100/50 p-1">
                            <TabsTrigger value="statistics" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
                                📊 Department Statistics
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="statistics" className="space-y-6 m-0 focus-visible:outline-none">
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
                            <StatsCard
                                label="Total Tickets Today"
                                value={kpis.totalTicketsReleased.toString()}
                                icon={<Ticket size={28} weight="fill" className="text-white" />}
                                color="bg-emerald-600"
                            />
                            <StatsCard
                                label="Outstanding Waiting"
                                value={kpis.totalWaitingPatients.toString()}
                                icon={<Users size={28} weight="fill" className="text-white" />}
                                color="bg-amber-500"
                            />
                            <StatsCard
                                label="Highest Volume Dept"
                                value={kpis.peakWaitingDepartment}
                                icon={<ClockCounterClockwise size={28} weight="bold" className="text-white" />}
                                color="bg-blue-500"
                            />
                            <StatsCard
                                label="Completed Visits"
                                value={kpis.resolvedTickets.toString()}
                                icon={<CheckCircle size={28} weight="fill" className="text-white" />}
                                color="bg-emerald-400"
                            />
                        </div>

                        <div className="bg-white p-6 border rounded-xl shadow-sm">
                            <h3 className="text-lg font-bold text-emerald-900 mb-4">Select a Department to View Stats</h3>
                            <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed rounded-lg">
                                Analytics visualization placeholder
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
