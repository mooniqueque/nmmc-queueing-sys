'use client'
import React, { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { SessionUser } from '@/types/auth';
import {
    ArrowsClockwise,
    SkipForward,
    XCircle
} from '@phosphor-icons/react';

const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

// Removed since live data type VisitWithPatient is used instead

// Live data logic below

import { useClinicQueue } from '@/app/(admin)/_hooks/use-clinic-queue';

export default function CallerDashboard({
    loggedInUser,
    departments,
    queueOptionsByDepartment,
    initialQueue = []
}: {
    loggedInUser: SessionUser;
    departments: string[];
    queueOptionsByDepartment: Record<string, string[]>;
    initialQueue?: any[];
}) {
    const availableDepartments = departments.length > 0 ? departments : ["ANIMAL BITE DEPT"];
    const [isAvailable, setIsAvailable] = useState(true);
    const [department, setDepartment] = useState(availableDepartments[0] ?? "ANIMAL BITE DEPT");

    // Live Queue Hook
    const { activeQueue } = useClinicQueue(department, initialQueue);

    // Calculate current stats & waitlist dynamically
    // A ticket is next if it's 'WAITING_CLINIC' and assigned to this `departmentId`
    const departmentQueue = activeQueue.filter((v: any) => v.department?.name === department);

    // Simplistic handling of what is "Now Serving" vs "Waitlist"
    // Usually, "Now Serving" would be status: 'SERVING' and Waitlist is 'WAITING_CLINIC'.
    // Here we just take the first from the waiting list as the "next to serve" or placeholder
    const currentTicket = departmentQueue.length > 0 ? `P-${departmentQueue[0].ticketNumber}` : "NONE";

    // Map backend data to UI expected shapes
    const waitlist = departmentQueue.slice(1, 4).map((v: any) => ({
        ticket: `P-${v.ticketNumber}`,
        category: v.priorityClass || "REGULAR",
        time: new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Stats calculation based on live queue
    const stats = {
        regular: departmentQueue.filter((v: any) => v.priorityClass?.includes('REG')).length.toString(),
        pediatric: departmentQueue.filter((v: any) => v.priorityClass?.includes('CHILD')).length.toString(),
        fastTrack: departmentQueue.filter((v: any) => v.priorityClass?.includes('FT')).length.toString(),
        erRef: departmentQueue.filter((v: any) => v.priorityClass?.includes('ER')).length.toString(),
    };

    const topButtons = queueOptionsByDepartment[normalizeDepartmentKey(department)] ?? DEFAULT_QUEUE_OPTIONS;

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
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <span className="text-sm font-bold text-emerald-900">{loggedInUser.name}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-tighter">{loggedInUser.role}</span>
                        </div>

                        <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50'>
                            <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                                {loggedInUser.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/*MAIN CONTENT*/}
                <main className="flex-1 p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

                        {/*LEFT SIDE CONTENT*/}
                        <div className="lg:col-span-3 flex flex-col gap-4">

                            {/*NOW SERVING*/}
                            <Card className="flex flex-col items-center justify-center p-19 py-20 shadow-sm border-0 bg-white relative overflow-hidden">
                                <span className="text-emerald-500 font-bold tracking-widest text-sm uppercase mb-1"> Current Patient Ticket
                                </span>
                                <h1 className="text-9xl leading-none font-bold text-slate-900 tracking-tighter drop-shadow-sm mb-4">
                                    {currentTicket}
                                </h1>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-emerald-900 text-white px-20 py-8 rounded-full text-xl font-bold tracking-wider shadow-lg shadow-emerald-700/20 mt-2 hover:bg-emerald-800 uppercase">
                                            {department}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-center text-xl font-bold text-emerald-950 uppercase tracking-widest">Select Department</DialogTitle>
                                            <DialogDescription className="text-center text-slate-400">
                                                Choose a department to switch the caller view.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* CLINIC GRID */}
                                        <div className="grid grid-cols-2 gap-3 py-4">
                                            {availableDepartments.map((departmentName) => (
                                                <DepartmentButton
                                                    key={departmentName}
                                                    label={departmentName}
                                                    current={department}
                                                    onClick={() => setDepartment(departmentName)}
                                                />
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </Card>

                            <div>
                                {/*TOP BUTTONS*/}
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full content-center mt-3">
                                    {topButtons.map((option, index) => (
                                        <TopButton
                                            key={option}
                                            label={option}
                                            hotkey={`Press ${index + 1}`}
                                            color={option === "REFERRALS" ? "bg-yellow-600" : "bg-emerald-800"}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/*BOTTOM BUTTONS*/}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <BotButton label="MARK SERVED" hotkey="Press S" />
                                <BotButton label="TRANSFER QUEUE" hotkey="Press Q" />
                                <BotButton label="NO SHOWS" hotkey="Press N" />
                                <BotButton label="PRINT TICKET" hotkey="Press P" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4" >

                            {/*WAIT LIST*/}
                            <Card className="p-4 border-0 shadow-sm bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">WAIT LISTS</span>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Next 3</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {waitlist.map((item: any, index: number) => (
                                        <WaitlistItem key={index} ticket={item.ticket} category={item.category} time={item.time} />
                                    ))}
                                </div>

                                <Button variant="ghost" className="w-full mt-3 text-xs font-bold text-slate-400 hover:text-slate-600 h-8">
                                    View Full List
                                </Button>
                            </Card>

                            {/*TOTAL TICKETS*/}
                            <Card className="p-4 border-0 shadow-sm bg-white">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">TOTAL TICKETS CALLED</span>
                                <div className="grid grid-cols-2 gap-4">
                                    <StatItem label="Regular" value={stats.regular} />
                                    <StatItem label="Pediatric" value={stats.pediatric} />
                                    <StatItem label="Fast Track" value={stats.fastTrack} />
                                    <StatItem label="ER-Ref" value={stats.erRef} />
                                </div>
                            </Card >

                            {/*SIDE BUTTONS*/}
                            <div className="flex flex-col gap-1">
                                <div className={buttonVariants({ variant: "outline", className: "h-14 w-full flex items-center justify-between px-7 bg-white border-0 shadow-sm hover:bg-slate-50 cursor-default" })}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="font-extrabold text-slate-700">Available</span>
                                    </div>
                                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                                </div>
                                <ActionButton icon={<XCircle />} label="No Show" color="text-red-500" />
                                <ActionButton icon={<SkipForward />} label="Switch Window" color="text-slate-500" />
                                <ActionButton icon={<ArrowsClockwise />} label="Re-Call Number" color="text-slate-500" />
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
            <span className="font-extrabold text-slate-700">{label}</span>
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

function DepartmentButton({ label, onClick, current }: { label: string, onClick: () => void, current: string }) {
    const isActive = current === label;
    return (
        <Button
            variant="outline"
            onClick={onClick}
            className={`h-24 flex flex-col items-center justify-center p-2 border-2 ${isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-100 hover:border-emerald-200 hover:bg-slate-50 text-slate-600'}`}
        >
            <span className="font-bold text-center leading-tight">{label}</span>
            {isActive && <span className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-wider">Active</span>}
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