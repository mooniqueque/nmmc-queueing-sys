'use client'
import React, { useState } from 'react';

import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MdPlayArrow,
    MdSkipNext,
    MdPause,
    MdRefresh,
    MdHistory,
    MdCheckCircle,
    MdCancel
} from 'react-icons/md';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch';

const historyData = [
    { ticket: 'REG-123', category: 'REGULAR', start: '10:45 AM', end: '10:58 AM', duration: '13 min', status: 'Served' },
    { ticket: 'FT-042', category: 'FAST TRACK', start: '10:30 AM', end: '10:44 AM', duration: '14 min', status: 'Served' },
    { ticket: 'REG-122', category: 'REGULAR', start: '10:15 AM', end: '--', duration: '--', status: 'No Show' },
    { ticket: 'CH-015', category: 'CHILD', start: '10:00 AM', end: '10:14 AM', duration: '14 min', status: 'Served' },
];

export default function CallerDashboard() {
    const [isAvailable, setIsAvailable] = useState(true);

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <div className="flex flex-1 flex-col">

                {/*HEADER*/}
                <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <h1 className="text-xl font-bold text-emerald-900">Caller Dashboard</h1>
                    </div>
                    <div className='flex items-center gap-3'>
                        <div className="flex flex-col items-end mr-1 hidden sm:flex">
                            <span className="text-sm font-bold text-emerald-300">Ami so pogi
                            </span>
                            <span className="text-xs text-slate-500">Administrator</span>
                        </div>

                        <Avatar className='size-10 border-2 border-emerald-100 bg emerald-50-text-emerald 700'>
                            <AvatarFallback className="font-bold">AS</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/*MAIN CONTENT*/}
                <main className="flex-1 p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

                        {/*LEFT SIDE CONTENT*/}
                        <div className="lg:col-span-3 flex flex-col gap-4">

                            {/*NOW SERVING*/}
                            <Card className="flex flex-col items-center justify-center p-19 py-17 shadow-sm border-0 bg-white relative overflow-hidden">
                                <span className="text-orange-500 font-bold tracking-widest text-sm uppercase mb-1"> Current Patient Ticket
                                </span>
                                <h1 className="text-8xl leading-none font-bold text-slate-900 tracking-tighter drop-shadow-sm mb-2">
                                    REG-124
                                </h1>

                                {/*BUTTONS*/}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full content-center mt-2">
                                    <TopButton label="REGULAR" hotkey="Press 1" color="bg-emerald-800" />
                                    <TopButton label="CHILD" hotkey="Press 2" color="bg-emerald-800" />
                                    <TopButton label="FT" hotkey="Press 3" color="bg-emerald-800" />
                                    <TopButton label="ER - REF" hotkey="Press 4" color="bg-emerald-800" />
                                    <TopButton label="REFERRALS" hotkey="Press 5" color="bg-yellow-600" />
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <BotButton label="MARK SERVED" hotkey="Press S" />
                                <BotButton label="TRANSFER QUEUE" hotkey="Press Q" />
                                <BotButton label="NO SHOWS" hotkey="Press N" />
                                <BotButton label="PRINT TICKET" hotkey="Press P" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4" >

                            {/*TOTAL TICKETS*/}
                            <Card className="p-4 border-0 shadow-sm bg-white">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">TOTAL TICKETS CALLED</span>
                                <div className="grid grid-cols-2 gap-4">
                                    <StatItem label="Regular" value="42" />
                                    <StatItem label="Pediatric" value="18" />
                                    <StatItem label="Fast Track" value="09" />
                                    <StatItem label="ER-Ref" value="05" />
                                </div>
                            </Card >
                            <Card className="p-4 border-0 shadow-sm bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WAIT LISTS</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Next 3</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <WaitlistItem ticket="REG-125" category="REGULAR" time="10:45 AM" />
                                    <WaitlistItem ticket="CH-016" category="CHILD" time="10:48 AM" />
                                    <WaitlistItem ticket="FT-043" category="FAST TRACK" time="10:50 AM" />
                                </div>

                                <Button variant="ghost" className="w-full mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 h-8">
                                    View Full List
                                </Button>
                            </Card>

                            <div className="flex flex-col gap-1">
                                <Button variant="outline" className="h-14 w-full flex items-center justify-between px-7 bg-white border-0 shadow-sm hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="font-bold font-extrabold text-slate-700">Available</span>
                                    </div>
                                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                                </Button>
                                <ActionButton icon={<MdCancel />} label="No Show" color="text-red-500" />
                                <ActionButton icon={<MdSkipNext />} label="Switch Window" color="text-slate-500" />
                                <ActionButton icon={<MdRefresh />} label="Re-Call Number" color="text-slate-500" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">{label}</span>
            <span className="text-2xl font-black text-slate-800">{value}</span>
        </div>
    )
}

function WaitlistItem({ ticket, category, time }: { ticket: string, category: string, time: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex flex-col">
                <span className="font-black text-slate-700 text-lg leading-none">{ticket}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">{category}</span>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm">{time}</span>
        </div>
    )
}

function ActionButton({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
    return (
        <Button variant="outline" className="h-15 flex items-center justify-start gap-6 px-7 bg-white border-0 shadow-sm hover:bg-slate-50">
            <span className={`text-xl ${color}`}>{icon}</span>
            <span className="font-bold font-extrabold text-slate-700">{label}</span>
        </Button>
    )
}

function TopButton({ label, hotkey, color = "bg-emerald-800" }: { label: string, hotkey: string, color?: string }) {
    return (
        <Button className={`h-24 flex flex-col items-start justify-center p-4 ${color} hover:opacity-90 text-left shadow-lg shadow-emerald-900/10 rounded-2xl`}>
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">{hotkey}</span>
            <span className="text-xl font-black tracking-wide text-white">{label}</span>
        </Button>
    )
}

function BotButton({ label, hotkey }: { label: string, hotkey: string }) {
    return (
        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{hotkey}</span>
            <span className="text-xl font-bold text-slate-800">{label}</span>
        </Button>
    )
}