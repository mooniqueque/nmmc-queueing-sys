'use client'

import React from 'react';
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MdPlayArrow,
    MdPrint,
    MdCheckCircle,
    MdCancel,
    MdMoveUp,
    MdPeople,
    MdPendingActions,
    MdChildCare,
    MdFlashOn,
    MdLocalHospital,
    MdOutput
} from 'react-icons/md';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function CallerDashboard() {
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

                <main className='flex- p-6 space-y-6 bg-slate-50/50 px-10'>
                    {/*CALL STATS*/}
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 ">
                        TOTAL RECENT CALLS
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3'>
                        <StatsCard label="Regular" value="58" icon={<MdPeople size={28} className="text-white" />} color="bg-emerald-600" />
                        <StatsCard label="Pediatric" value="06" icon={<MdChildCare size={28} className="text-white" />} color="bg-yellow-500" />
                        <StatsCard label="FT" value="01" icon={<MdFlashOn size={28} className="text-white" />} color="bg-emerald-500" />
                        <StatsCard label="ER - REF" value="01" icon={<MdLocalHospital size={28} className="text-white" />} color="bg-red-500" />
                        <StatsCard label="REFERALS" value="01" icon={<MdOutput size={28} className="text-white" />} color="bg-green-500" />
                    </div>

                    {/*MAIN CONT (LEFT)*/}
                    <Card className="flex flex-col lg:flex-row p-12 gap-12 h-auto items-center shadow-lg border-0 mb-6">
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 lg:border-r lg:border-slate-100 w-full lg:pr-12">
                            <span className="text-emerald-800 font-bold tracking-widest text-lg">NOW SERVING</span>
                            <h1 className="text-7xl font-black text-emerald-950 drop-shadow-xl tracking-tighter">REG - 01</h1>
                            <div className="bg-emerald-900 text-white px-10 py-2 rounded-full font-bold tracking-wide text-l shadow-lg shadow-emerald-900/20">
                                ANIMAL BITE DEPT
                            </div>
                        </div>

                        {/*MAIN CONT (RIGHT)*/}
                        <div className="flex-1 grid grid-cols-3 gap-3 w-full h-full content-center">

                            {/*REGULAR*/}
                            <Button className="h-22 flex flex-col items-start justify-center p-4 bg-emerald-800 hover:bg-emerald-900 text-left shadow-lg shadow-emerald-900/10 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-100/60 uppercase tracking-wider">Press 1</span>
                                <span className="text-2xl font-bold tracking-wide text-white">REGULAR</span>
                            </Button>

                            {/*CHILD*/}
                            <Button className="h-22 flex flex-col items-start justify-center p-4 bg-emerald-800 hover:bg-emerald-900 text-left shadow-lg shadow-emerald-900/10 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-100/60 uppercase tracking-wider">Press 2</span>
                                <span className="text-2xl font-bold tracking-wide text-white">CHILD</span>
                            </Button>

                            {/*FT*/}
                            <Button className="h-22 flex flex-col items-start justify-center p-4 bg-emerald-800 hover:bg-emerald-900 text-left shadow-lg shadow-emerald-900/10 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-100/60 uppercase tracking-wider">Press 3</span>
                                <span className="text-2xl font-bold tracking-wide text-white">FT</span>
                            </Button>

                            {/*ER REF*/}
                            <Button className="h-22 flex flex-col items-start justify-center p-4 bg-emerald-800 hover:bg-emerald-900 text-left shadow-lg shadow-emerald-900/10 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-100/60 uppercase tracking-wider">Press 4</span>
                                <span className="text-2xl font-bold tracking-wide text-white">ER - REF</span>
                            </Button>

                            {/*REFERRALS*/}
                            <Button className="h-22 flex flex-col items-start justify-center p-4 bg-yellow-600 hover:bg-yellow-900 text-left shadow-lg shadow-emerald-900/10 rounded-2xl">
                                <span className="text-xs font-bold text-emerald-100/60 uppercase tracking-wider">Press 5</span>
                                <span className="text-2xl font-bold tracking-wide text-white">REFERRALS</span>
                            </Button>
                        </div>
                    </Card>

                    {/*BOTTOM BUTTONS*/}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center px-8 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Press S</span>
                            <span className="text-xl font-bold text-slate-800">MARK SERVED</span>
                        </Button>

                        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center px-8 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Press Q</span>
                            <span className="text-xl font-bold text-slate-800">TRANSFER QUEUES</span>
                        </Button>
                        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center px-8 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Press N</span>
                            <span className="text-xl font-bold text-slate-800">NO SHOWS</span>
                        </Button>
                        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center px-8 bg-slate-400 hover:bg-slate-500 text-slate-700 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Press A</span>
                            <span className="text-xl font-bold text-slate-800">PRINT TICKET</span>
                        </Button>
                    </div>


                </main>

            </div>

        </div>
    )
}

function StatsCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <Card className='shadow-sm border-0 ring-1 ring-slate-100 px-4 mt-2'>
            <div className="flex items-center gap-3">
                {/*ICON*/}
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-md shadow-emerald-100/50`}>
                    {icon}
                </div>
                {/*TEXT*/}
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
                    <h3 className="text-3xl font-bold text-slate-800 leading-none">{value}</h3>
                </div>
            </div>
        </Card>
    )
}
