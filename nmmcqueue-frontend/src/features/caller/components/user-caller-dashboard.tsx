'use client'
import React, { useState } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    ArrowsClockwise,
    SkipForward,
    XCircle
} from '@phosphor-icons/react';



function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

import { useClinicQueue } from '@/app/(admin)/_hooks/use-clinic-queue';
import { VisitWithPatient } from '@/features/triage/types';
import { toast } from 'sonner';
import { callPatient, servePatient, noShowPatient, notifyPatient } from '../api';

export default function UserCallerDashboard({
    department,
    queueOptionsByDepartment,
    initialQueue = []
}: {
    department: string;
    queueOptionsByDepartment: Record<string, string[]>;
    initialQueue?: VisitWithPatient[];
}) {
    const [isAvailable, setIsAvailable] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Live Queue Hook locked directly to the user's role department
    const { activeQueue } = useClinicQueue(department, initialQueue);

    // Filter queue to make absolutely sure we only count tickets for THIS department
    const departmentQueue = activeQueue.filter((v: VisitWithPatient) => 
        v.department?.name?.toUpperCase() === department.toUpperCase()
    );

    // Simplistic handling of what is "Now Serving" vs "Waitlist"
    const inProgressVisit = departmentQueue.find(v => v.status === 'IN_PROGRESS');
    const waitingList = departmentQueue.filter(v => v.status === 'WAITING_CLINIC');
    const nextVisit = waitingList.length > 0 ? waitingList[0] : null;

    const currentTicket = inProgressVisit 
        ? `P-${inProgressVisit.ticketNumber}` 
        : (nextVisit ? `Next: P-${nextVisit.ticketNumber}` : "NONE");

    const waitlist = waitingList.slice(0, 3).map((v: VisitWithPatient) => ({
        ticket: `P-${v.ticketNumber}`,
        category: v.priorityClass || "REGULAR",
        time: new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Action Handlers
    const handleCallNext = async () => {
        if (!nextVisit) return toast.info("No more patients in the waiting list.");
        if (inProgressVisit) return toast.error("Please Mark Served or No Show the current patient first.");
        
        setIsProcessing(true);
        try {
            await callPatient(nextVisit.id);
            toast.success(`Called patient P-${nextVisit.ticketNumber}`);
        } catch {
            toast.error("Failed to call patient");
        }
        setIsProcessing(false);
    };

    const handleServe = async () => {
        if (!inProgressVisit) return toast.error("No active patient to serve.");
        setIsProcessing(true);
        try {
            await servePatient(inProgressVisit.id);
            toast.success("Patient marked as served.");
        } catch {
            toast.error("Failed to mark patient as served");
        }
        setIsProcessing(false);
    };

    const handleNoShow = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return toast.error("No patient selected to mark as No Show.");
        setIsProcessing(true);
        try {
            await noShowPatient(targetVisit.id);
            toast.error(`Patient P-${targetVisit.ticketNumber} marked as NO SHOW`);
        } catch {
            toast.error("Failed to process No Show");
        }
        setIsProcessing(false);
    };

    const handleNotify = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return toast.error("No patient selected to notify.");
        setIsProcessing(true);
        try {
            await notifyPatient(targetVisit.id);
            toast.success("SMS Notification simulated / sent.");
        } catch {
            toast.error("Failed to send notification.");
        }
        setIsProcessing(false);
    };

    // Stats calculation based on live queue
    const stats = {
        regular: departmentQueue.filter((v: VisitWithPatient) => v.priorityClass?.includes('REG')).length.toString(),
        pediatric: departmentQueue.filter((v: VisitWithPatient) => v.priorityClass?.includes('CHILD')).length.toString(),
        fastTrack: departmentQueue.filter((v: VisitWithPatient) => v.priorityClass?.includes('FT')).length.toString(),
        erRef: departmentQueue.filter((v: VisitWithPatient) => v.priorityClass?.includes('ER')).length.toString(),
    };

    const topButtons = queueOptionsByDepartment[normalizeDepartmentKey(department)] ?? [];

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <div className="flex flex-1 flex-col">



                {/*MAIN CONTENT*/}
                <main className="flex-1 p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

                        {/*LEFT SIDE CONTENT*/}
                        <div className="lg:col-span-3 flex flex-col gap-4">

                            {/*NOW SERVING*/}
                            <Card className="flex flex-col items-center justify-center p-19 py-20 shadow-sm border-0 bg-white relative overflow-hidden">
                                <span className="text-emerald-500 font-bold tracking-widest text-sm uppercase mb-1"> Current Patient Ticket</span>
                                <h1 className="text-9xl leading-none font-bold text-slate-900 tracking-tighter drop-shadow-sm mb-4">
                                    {currentTicket}
                                </h1>
                                {/* Strict Department Display (No Switcher Dialog) */}
                                <Button className="bg-emerald-900 cursor-default text-white px-20 py-8 rounded-full text-xl font-bold tracking-wider shadow-lg shadow-emerald-700/20 mt-2 uppercase">
                                    {department}
                                </Button>
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
                                {inProgressVisit ? (
                                    <BotButton onClick={handleServe} disabled={isProcessing} label="MARK SERVED" hotkey="Press S" />
                                ) : (
                                    <BotButton onClick={handleCallNext} disabled={isProcessing || !nextVisit} label="CALL NEXT" hotkey="Press C" />
                                )}
                                <BotButton onClick={handleNotify} disabled={isProcessing} label="NOTIFY / RE-CALL" hotkey="Press R" />
                                <BotButton onClick={handleNoShow} disabled={isProcessing} label="NO SHOW" hotkey="Press N" />
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
                                    {waitlist.map((item: { ticket: string, category: string, time: string }, index: number) => (
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
                                <ActionButton icon={<XCircle />} onClick={handleNoShow} disabled={isProcessing} label="No Show" color="text-red-500" />
                                <ActionButton icon={<SkipForward />} label="Switch Window" color="text-slate-500" />
                                <ActionButton icon={<ArrowsClockwise />} onClick={handleNotify} disabled={isProcessing} label="Re-Call Number" color="text-slate-500" />
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

function ActionButton({ icon, label, color, onClick, disabled }: { icon: React.ReactNode, label: string, color: string, onClick?: () => void, disabled?: boolean }) {
    return (
        <Button variant="outline" onClick={onClick} disabled={disabled} className="h-15 flex items-center justify-start gap-6 px-7 bg-white border-0 shadow-sm hover:bg-slate-50">
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

function BotButton({ label, hotkey, onClick, disabled }: { label: string, hotkey?: string, onClick?: () => void, disabled?: boolean }) {
    return (
        <Button variant="secondary" onClick={onClick} disabled={disabled} className="h-20 flex flex-col items-start justify-center px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl">
            {hotkey && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{hotkey}</span>}
            <span className="text-xl font-bold text-slate-800">{label}</span>
        </Button>
    )
}
