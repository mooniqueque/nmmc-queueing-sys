"use client";
import { useState } from 'react';
import Image from 'next/image'
import {
    MdDescription,
    MdPhone,
    MdMonitor,
    MdLogout,
    MdSupportAgent,
    MdSearch,
    MdFilterList,
    MdVolumeUp,
} from 'react-icons/md';

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarFooter,
} from '@/components/ui/sidebar'
import { Badge } from "@/components/ui/badge"

interface UserInfo {
    name: string;
    email: string;
    role: string;
}

interface CallRecord {
    id: number;
    ticketNumber: string;
    department: string;
    window: number;
    calledTime: string;
    status: 'called' | 'serving' | 'completed';
}

export default function UserCallNumber({ userInfo }: { userInfo: UserInfo }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'called' | 'serving' | 'completed'>('all');

    const callRecords: CallRecord[] = [
        { id: 1, ticketNumber: 'Q-ANI-001', department: 'Animal Bite', window: 1, calledTime: '10:30 AM', status: 'completed' },
        { id: 2, ticketNumber: 'Q-CAR-002', department: 'Cardiology', window: 2, calledTime: '10:45 AM', status: 'serving' },
        { id: 3, ticketNumber: 'Q-DEN-003', department: 'Dental', window: 3, calledTime: '11:00 AM', status: 'called' },
        { id: 4, ticketNumber: 'Q-EC-004', department: 'EC', window: 4, calledTime: 'Waiting', status: 'called' },
    ];

    const filteredRecords = callRecords.filter(record => {
        const matchesSearch = record.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.department.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'called': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'serving': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
                            <h1 className="text-xl font-bold text-emerald-900">Call Number Monitor</h1>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-emerald-800">Call Queue</h2>
                                <p className="text-sm text-muted-foreground">View current and recent call numbers being served</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 w-[300px]">
                                    <div className="relative w-full">
                                        <div className="absolute left-3 top-2.5 text-slate-400">
                                            <MdSearch size={20} />
                                        </div>
                                        <Input 
                                            placeholder="Search ticket number....." 
                                            className="pl-10 bg-white border-slate-200"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <Button variant="outline" className="text-slate-600 border-slate-200">
                                    <MdFilterList size={18} className="mr-2" /> Filter
                                </Button>
                            </div>
                        </div>

                        {/* CURRENT CALL CARD */}
                        <Card className="shadow-lg border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50">
                            <CardHeader className="border-b border-emerald-200">
                                <CardTitle className="text-lg text-emerald-900">Now Calling</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 mb-2">Ticket Number</p>
                                        <p className="text-5xl font-bold text-emerald-700">Q-CAR-002</p>
                                        <p className="text-sm text-slate-600 mt-2">Cardiology - Window 2</p>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                            <MdVolumeUp size={20} /> Play Sound
                                        </Button>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Called at</p>
                                            <p className="text-lg font-semibold text-slate-700">10:45 AM</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* CALL HISTORY TABLE */}
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="border-b border-slate-200">
                                <CardTitle className="text-lg text-emerald-900">Call History</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-3">
                                    {filteredRecords.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{record.ticketNumber}</p>
                                                <p className="text-sm text-slate-600">{record.department}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Window</p>
                                                    <p className="font-semibold text-slate-900">{record.window}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-500">Time</p>
                                                    <p className="text-sm font-medium text-slate-700">{record.calledTime}</p>
                                                </div>
                                                <Badge className={`${getStatusColor(record.status)} border capitalize`}>
                                                    {record.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                    </main>

                </div>

            </SidebarProvider >

        </div >
    )
}
