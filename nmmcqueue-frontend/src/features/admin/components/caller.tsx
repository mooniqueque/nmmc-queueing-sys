'use client'
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';
import { SessionUser } from '@/types/auth';
import {
    ArrowsClockwise,
    SkipForward,
    Desktop,
    CheckCircle,
    XCircle
} from '@phosphor-icons/react';
import { AdminHeader } from "@/components/layouts/admin-header";
import { VisitWithPatient } from "@/features/triage/types";

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
    initialQueue?: VisitWithPatient[];
}) {
    const availableDepartments = departments.length > 0 ? departments : ["ANIMAL BITE DEPT"];
    const [isAvailable, setIsAvailable] = useState(true);
    const [department, setDepartment] = useState(availableDepartments[0] ?? "ANIMAL BITE DEPT");

    // Live Queue Hook
    const { activeQueue } = useClinicQueue(department, initialQueue);

    // Calculate current stats & waitlist dynamically
    // A ticket is next if it's 'WAITING_CLINIC' and assigned to this `departmentId`
    const departmentQueue = activeQueue.filter((v: VisitWithPatient) => v.department?.name === department);

    // Simplistic handling of what is "Now Serving" vs "Waitlist"
    // Usually, "Now Serving" would be status: 'SERVING' and Waitlist is 'WAITING_CLINIC'.
    // Here we just take the first from the waiting list as the "next to serve" or placeholder
    const currentTicket = departmentQueue.length > 0 ? `P-${departmentQueue[0].ticketNumber}` : "NONE";

    // Map backend data to UI expected shapes
    const waitlist = departmentQueue.slice(1, 4).map((v: VisitWithPatient) => ({
        ticket: `P-${v.ticketNumber}`,
        category: v.categories?.[0]?.category?.code || "REGULAR",
        time: new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Stats calculation based on live queue
    const stats = {
        regular: departmentQueue.filter((v: VisitWithPatient) => v.categories?.some(c => c.category?.code?.includes('REG'))).length.toString(),
        pediatric: departmentQueue.filter((v: VisitWithPatient) => v.categories?.some(c => c.category?.code?.includes('CHILD'))).length.toString(),
        fastTrack: departmentQueue.filter((v: VisitWithPatient) => v.categories?.some(c => c.category?.code?.includes('FT'))).length.toString(),
        erRef: departmentQueue.filter((v: VisitWithPatient) => v.categories?.some(c => c.category?.code?.includes('ER'))).length.toString(),
    };

    const topButtons = queueOptionsByDepartment[normalizeDepartmentKey(department)] ?? DEFAULT_QUEUE_OPTIONS;

    return (
        <div className="flex flex-1 flex-col bg-background">
            <AdminHeader 
                user={loggedInUser} 
                title="Caller Dashboard" 
                subtitle={department}
            />

            {/* MAIN CONTENT */}
            <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* LEFT SIDE CONTENT */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* NOW SERVING */}
                        <Card className="flex flex-col items-center justify-center py-16 relative overflow-hidden text-center border-border shadow-md bg-card">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary/40" />
                            <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
                            
                            <span className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground uppercase mb-4 relative z-10">
                                Currently Serving
                            </span>
                            
                            <div className="text-[10rem] md:text-[12rem] leading-none font-black tracking-tighter text-foreground relative z-10 tabular-nums">
                                {currentTicket}
                            </div>

                            <div className="mt-8 relative z-10">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button 
                                            size="lg" 
                                            variant="secondary"
                                            className="rounded-full px-12 h-14 text-[10px] font-bold uppercase tracking-widest border border-border hover:bg-muted transition-all"
                                        >
                                            <Desktop size={18} className="mr-2 text-primary" weight="bold" />
                                            Station: {department}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md border-border bg-card">
                                        <DialogHeader>
                                            <DialogTitle className="text-sm font-bold uppercase tracking-widest">Select Station</DialogTitle>
                                            <DialogDescription className="text-xs">
                                                Switch to a different department caller view.
                                            </DialogDescription>
                                        </DialogHeader>
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
                            </div>
                        </Card>

                        <div className="space-y-4">
                            {/* TOP BUTTONS - PRIORITY CLASSES */}
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                {topButtons.map((option, index) => (
                                    <TopButton
                                        key={option}
                                        label={option}
                                        hotkey={`${index + 1}`}
                                        variant={option === "REFERRALS" ? "secondary" : "default"}
                                    />
                                ))}
                            </div>

                            {/* BOTTOM BUTTONS - CORE ACTIONS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <BotButton label="MARK SERVED" hotkey="S" icon={<CheckCircle size={20} />} />
                                <BotButton label="TRANSFER" hotkey="Q" icon={<ArrowsClockwise size={20} />} />
                                <BotButton label="NO SHOWS" hotkey="N" icon={<XCircle size={20} />} />
                                <BotButton label="PRINT TICKET" hotkey="P" icon={<Desktop size={20} />} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="space-y-6">
                        {/* WAIT LIST */}
                        <Card className="flex flex-col border-border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wait List</span>
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Next 3</span>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {waitlist.length > 0 ? (
                                        waitlist.map((item: any, index: number) => (
                                            <WaitlistItem key={index} ticket={item.ticket} category={item.category} time={item.time} />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                            <div className="size-8 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                                <CheckCircle size={20} className="text-muted-foreground/40" />
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Queue is clear</p>
                                        </div>
                                    )}
                                </div>
                                {waitlist.length > 0 && (
                                    <Button variant="ghost" className="w-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest h-10 rounded-none hover:bg-muted/50">
                                        View Full Queue
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* STATS */}
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-4 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Session Summary</span>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-2 p-3">
                                <StatItem label="Regular" value={stats.regular} />
                                <StatItem label="Pediatric" value={stats.pediatric} />
                                <StatItem label="Fast Track" value={stats.fastTrack} />
                                <StatItem label="ER-Ref" value={stats.erRef} />
                            </CardContent>
                        </Card>

                        {/* CONTROLS */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className={cn("size-2 rounded-full", isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground/30')} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest italic">{isAvailable ? 'Available' : 'Busy'}</span>
                                </div>
                                <Switch checked={isAvailable} onCheckedChange={setIsAvailable} className="data-[state=checked]:bg-emerald-500" />
                            </div>
                            <ActionButton icon={<XCircle size={18} weight="bold" />} label="Move to No Show" className="text-destructive hover:bg-destructive/5 hover:text-destructive border-border/50" />
                            <ActionButton icon={<SkipForward size={18} weight="bold" />} label="Skip Ticket" className="hover:bg-amber-500/5 hover:text-amber-600 border-border/50" />
                            <ActionButton icon={<ArrowsClockwise size={18} weight="bold" />} label="Re-Call Number" className="hover:bg-primary/5 hover:text-primary border-border/50" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col items-center p-3 py-4 bg-muted/20 border border-border/40 rounded-xl transition-all hover:border-primary/20 group">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5 transition-colors group-hover:text-primary">{label}</span>
            <span className="text-2xl font-black tabular-nums">{value}</span>
        </div>
    );
}

function WaitlistItem({ ticket, category, time }: { ticket: string, category: string, time: string }) {
    return (
        <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-all cursor-default group">
            <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{ticket}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{category}</span>
            </div>
            <span className="text-[9px] font-bold tabular-nums text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/50 shadow-sm">{time}</span>
        </div>
    );
}

function ActionButton({ icon, label, className }: { icon: React.ReactNode, label: string, className?: string }) {
    return (
        <Button variant="outline" className={cn("w-full h-12 justify-start gap-3 px-4 text-[10px] font-bold uppercase tracking-widest transition-all", className)}>
            <span className="opacity-70">{icon}</span>
            {label}
        </Button>
    );
}

function TopButton({ label, hotkey, variant = "default" }: { label: string, hotkey: string, variant?: "default" | "secondary" }) {
    return (
        <Button variant={variant} className={cn(
            "h-24 flex flex-col items-start justify-center p-5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent shadow-sm",
            variant === "default" ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-card text-foreground border-border hover:bg-muted"
        )}>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">HOTKEY {hotkey}</span>
            <span className="text-base font-black tracking-tight uppercase leading-none">{label}</span>
        </Button>
    );
}

function DepartmentButton({ label, onClick, current }: { label: string, onClick: () => void, current: string }) {
    const isActive = current === label;
    return (
        <Button
            variant={isActive ? "default" : "outline"}
            onClick={onClick}
            className={cn(
                "h-20 flex flex-col items-center justify-center p-4 gap-2 transition-all border shadow-sm",
                isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
            )}
        >
            <span className="text-[10px] font-bold uppercase tracking-widest text-center hyphens-auto">{label}</span>
            {isActive && <div className="h-0.5 w-4 bg-current rounded-full mt-1" />}
        </Button>
    );
}

function BotButton({ label, hotkey, icon }: { label: string, hotkey: string, icon: React.ReactNode }) {
    return (
        <Button variant="secondary" className="h-20 flex flex-col items-start justify-center p-6 rounded-xl hover:bg-muted transition-all border border-border/50 group">
            <div className="flex w-full justify-between items-center mb-1.5 ">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">{hotkey}</span>
                <span className="text-primary transition-transform group-hover:scale-110">{icon}</span>
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
        </Button>
    );
}