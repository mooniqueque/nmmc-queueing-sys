"use client";

import Image from 'next/image';
import {
    MdDescription,
    MdLogout,
    MdMonitor,
    MdPhone,
    MdSupportAgent,
} from 'react-icons/md';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';

interface UserInfo {
    name: string;
    email: string;
    role: string;
}

interface MonitorData {
    department: string;
    currentTicket: string;
    window: number;
    waitingCount: number;
    servedCount: number;
    avgWaitTime: string;
    status: 'active' | 'idle' | 'break';
}

export default function UserMonitor({ userInfo }: { userInfo: UserInfo }) {
    const monitorData: MonitorData[] = [
        {
            department: 'Animal Bite',
            currentTicket: 'Q-ANI-015',
            window: 1,
            waitingCount: 5,
            servedCount: 14,
            avgWaitTime: '15 min',
            status: 'active',
        },
        {
            department: 'Cardiology',
            currentTicket: 'Q-CAR-008',
            window: 2,
            waitingCount: 3,
            servedCount: 8,
            avgWaitTime: '20 min',
            status: 'active',
        },
        {
            department: 'Dental',
            currentTicket: 'Q-DEN-012',
            window: 3,
            waitingCount: 2,
            servedCount: 12,
            avgWaitTime: '10 min',
            status: 'active',
        },
        {
            department: 'EC',
            currentTicket: 'Q-EC-020',
            window: 4,
            waitingCount: 8,
            servedCount: 20,
            avgWaitTime: '25 min',
            status: 'active',
        },
        {
            department: 'ENT',
            currentTicket: 'Waiting',
            window: 5,
            waitingCount: 0,
            servedCount: 5,
            avgWaitTime: 'N/A',
            status: 'idle',
        },
        {
            department: 'Eye Care',
            currentTicket: 'Q-EYE-006',
            window: 6,
            waitingCount: 1,
            servedCount: 6,
            avgWaitTime: '12 min',
            status: 'active',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'idle': return 'bg-slate-50 text-slate-700 border-slate-200';
            case 'break': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <SidebarProvider>

                {/* sidebar */}
                <Sidebar className="border-r bg-emerald-50/50">
                    <SidebarContent>
                        <div className="p-4 flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 flex items-center justify-center relative">
                                <Image
                                    src="/logo.png"
                                    alt="NMMC Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-full ring-2 ring-emerald-100 object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm leading-tight text-emerald-950 ml-2"> Northern Mindanao Medical Center</span>
                            </div>
                        </div>

                        {/*main nav*/}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {/*FOR RELEASING*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/releasing'>
                                                <MdDescription size={20} className="text-emerald-700" />
                                                <span>Releasing</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR CALL NUMBER*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/call-number'>
                                                <MdPhone size={20} className="text-emerald-700" />
                                                <span>Call Number</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR MONITOR*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/monitor'>
                                                <MdMonitor size={20} className="text-emerald-700" />
                                                <span>Monitor</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    {/*SIDEBAR FOOTER*/}
                    <SidebarFooter className="border-t p-4 bg-emerald-50/30">
                        <SidebarMenu className="gap-2">

                            {/*CONTACT SUPP*/}
                            <SidebarMenuItem className="mb-2">
                                <SidebarMenuButton className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto">
                                    <a href="#" className="flex items-left gap-2">
                                        <MdSupportAgent size={20} className="mr-2" />
                                        <span> Contact Support </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*LOGOUT*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start">
                                    <a href="#" className="flex items-center gap-2">
                                        <MdLogout size={20} className="mr-2" />
                                        <span> Logout </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                {/*MAIN CONTAINER*/}
                <div className='flex flex-1 flex-col'>

                    {/*HEADER*/}
                    <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                            <h1 className="text-xl font-bold text-emerald-900">Queue Monitor</h1>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className="hidden sm:flex flex-col items-end mr-1">
                                <span className="text-sm font-bold text-emerald-300">{userInfo.name}</span>

                                <span className="text-xs text-slate-500">Patient</span>
                            </div>

                            <Avatar className='size-10 border-2 border-emerald-100 bg-emerald-50'>
                                <AvatarFallback className="font-bold">{userInfo.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                    </header>

                    <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10'>

                        {/* HEADER SECTION */}
                        <div>
                            <h2 className="text-2xl font-semibold text-emerald-800">System Queue Status</h2>
                            <p className="text-sm text-muted-foreground">View real-time queue status across all departments</p>
                        </div>

                        {/* DEPARTMENTS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {monitorData.map((data, idx) => (
                                <Card key={idx} className="shadow-sm border-slate-200 overflow-hidden">
                                    <CardHeader className="border-b border-slate-200 pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base text-emerald-900">{data.department}</CardTitle>
                                                <p className="text-xs text-slate-500">Window {data.window}</p>
                                            </div>
                                            <Badge className={`${getStatusColor(data.status)} border capitalize`}>
                                                {data.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-3">
                                        {/* Current Ticket */}
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <p className="text-xs text-slate-500 font-medium">Now Serving</p>
                                            <p className="text-2xl font-bold text-emerald-700">{data.currentTicket}</p>
                                        </div>

                                        {/* Queue Stats */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                                <p className="text-xs text-blue-600 font-medium">Waiting</p>
                                                <p className="text-xl font-bold text-blue-700">{data.waitingCount}</p>
                                            </div>
                                            <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                                                <p className="text-xs text-emerald-600 font-medium">Served Today</p>
                                                <p className="text-xl font-bold text-emerald-700">{data.servedCount}</p>
                                            </div>
                                        </div>

                                        {/* Avg Wait Time */}
                                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                            <p className="text-xs text-yellow-600 font-medium">Avg Wait Time</p>
                                            <p className="text-sm font-semibold text-yellow-700">{data.avgWaitTime}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* SYSTEM STATS */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b border-slate-200">
                                <CardTitle className="text-lg text-emerald-900">System Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <p className="text-sm text-emerald-600 font-medium mb-1">Active Windows</p>
                                        <p className="text-3xl font-bold text-emerald-700">5</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-600 font-medium mb-1">Total Waiting</p>
                                        <p className="text-3xl font-bold text-blue-700">19</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <p className="text-sm text-purple-600 font-medium mb-1">Served Today</p>
                                        <p className="text-3xl font-bold text-purple-700">65</p>
                                    </div>
                                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <p className="text-sm text-yellow-600 font-medium mb-1">Avg Wait</p>
                                        <p className="text-3xl font-bold text-yellow-700">16 min</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                    </main>

                </div>

            </SidebarProvider >

        </div >
    )
}
