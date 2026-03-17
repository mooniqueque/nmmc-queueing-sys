"use client";

import {
    Ticket,
    Users,
    ClockCounterClockwise,
    CheckCircle,
} from '@phosphor-icons/react';
import { VisitWithPatient } from '@/features/triage/types';
import { AdminHeader } from "@/components/layouts/admin-header";
import { StatsCard } from './stats-card';
import { SessionUser } from '@/types/auth';
import { Department } from '@/types/models';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="flex flex-1 flex-col">
            {/* HEADER */}
            <AdminHeader 
                user={loggedInUser} 
                title="Releasing Analytics" 
            />

            <main className="flex-1 p-6 lg:p-10 space-y-8 overflow-y-auto">
                <Tabs defaultValue="statistics" className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Releasing Dashboard</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Monitor hospitalization releases and department performance
                            </p>
                        </div>
                        <TabsList className="w-fit">
                            <TabsTrigger value="statistics" className="gap-2">
                                <Ticket size={16} />
                                <span>Analytics</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="statistics" className="space-y-8 m-0 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                label="Total Today"
                                value={kpis.totalTicketsReleased.toString()}
                                icon={<Ticket size={24} weight="fill" />}
                                color="bg-primary text-primary-foreground"
                            />
                            <StatsCard
                                label="Outstanding"
                                value={kpis.totalWaitingPatients.toString()}
                                icon={<Users size={24} weight="fill" />}
                                color="bg-amber-500/10 text-amber-600"
                            />
                            <StatsCard
                                label="Peak Dept"
                                value={kpis.peakWaitingDepartment}
                                icon={<ClockCounterClockwise size={24} weight="bold" />}
                                color="bg-blue-500/10 text-blue-600"
                            />
                            <StatsCard
                                label="Completed"
                                value={kpis.resolvedTickets.toString()}
                                icon={<CheckCircle size={24} weight="fill" />}
                                color="bg-emerald-500/10 text-emerald-600"
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Department Breakdown</CardTitle>
                                <CardDescription>Select a department to view detailed statistics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 border border-dashed rounded-lg">
                                    Queue visualization implementation pending
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
