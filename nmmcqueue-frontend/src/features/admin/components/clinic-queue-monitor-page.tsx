"use client";

import { useClinicQueue } from "@/app/(admin)/_hooks/use-clinic-queue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitWithPatient } from "@/features/triage/types";
import { API_URL } from "@/lib/api";
import { AdminHeader } from "@/shared/layouts";
import { cn } from "@/shared/lib/utils";
import { SessionUser } from "@/shared/types/auth";
import { Play } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export default function QueueMonitor({
    departmentName,
    initialQueue,
    loggedInUser,
}: {
    departmentName: string;
    initialQueue?: VisitWithPatient[];
    loggedInUser: SessionUser;
}) {
    // Live Queue Hook
    const { activeQueue } = useClinicQueue(departmentName, initialQueue || []);

    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch department video info
        const loadVideo = async () => {
            const { getDepartmentsVideos } = await import('@/features/monitoring/actions');
            const res = await getDepartmentsVideos();
            if (res.success) {
                const dept = res.data.find((d: any) => d.name === departmentName);
                if (dept) setVideoUrl(dept.videoUrl);
            }
        };
        loadVideo();
    }, [departmentName]);

    const getFullVideoUrl = (url: string) => {
        const backendUrl = API_URL.replace('/api', '');
        return `${backendUrl}${url}`;
    };

    // Calculate dynamically from the active array filtering for the target department
    const departmentQueue = activeQueue.filter((v: VisitWithPatient) => v.department?.name === departmentName);

    // Simplistic handling of what is "Now Serving" vs "Waitlist"
    const currentTicket = departmentQueue.length > 0 ? `P-${departmentQueue[0].ticketNumber}` : "NONE";

    // Map backend data to UI expected shapes for Monitor
    const UPCOMING_QUEUE = departmentQueue.slice(1, 5).map((v: VisitWithPatient) => {
        const priorityCode = v.categories?.[0]?.category?.code || "REGULAR";
        return {
            ticket: `P-${v.ticketNumber}`,
            category: priorityCode,
            type: priorityCode.includes('FT') || priorityCode.includes('ER') ? 'urgent' :
                priorityCode.includes('PRIO') || priorityCode.includes('CHILD') || priorityCode.includes('SR') ? 'priority' : 'regular'
        };
    });

    const SERVING_LIST = [
        { service: departmentName, ticket: currentTicket },
    ];

    // Helper for styling tickets based on type
    const getTicketStyle = (type: string) => {
        switch (type) {
            case 'priority': return 'bg-red-50 border-red-100 text-red-900 border';
            case 'urgent': return 'bg-orange-50 border-orange-100 text-orange-900 border';
            default: return 'bg-emerald-50 border-emerald-100 text-emerald-900 border';
        }
    };

    const getLabelStyle = (type: string) => {
        switch (type) {
            case 'priority': return 'text-red-500';
            case 'urgent': return 'text-orange-500';
            default: return 'text-emerald-500';
        }
    };

    return (
        <div className="w-full h-screen bg-background flex flex-col overflow-hidden">
            {/* HEADER */}
            <AdminHeader 
                user={loggedInUser} 
                title="Queue Monitor" 
                subtitle={departmentName}
            />

            <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
                {/* LEFT COLUMN: Service List */}
                <div className="col-span-1 flex flex-col h-full overflow-hidden border rounded-3xl bg-card shadow-xl shadow-primary/5">
                    <div className="flex justify-between px-8 py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs">
                        <span>Station</span>
                        <span>Now Serving</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {SERVING_LIST.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-6 px-8 bg-background border rounded-2xl transition-all hover:bg-accent/5">
                                <span className="text-sm font-bold uppercase tracking-tight line-clamp-2 w-1/2">
                                    {item.service}
                                </span>
                                <span className="text-5xl font-black text-primary tracking-tighter tabular-nums w-1/2 text-right">
                                    {item.ticket}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Video & Upcoming */}
                <div className="col-span-2 flex flex-col gap-8 h-full">
                    {/* TOP: Video Player */}
                    <Card className="h-[60%] bg-black rounded-3xl overflow-hidden relative shadow-2xl group border-0">
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
                            {videoUrl ? (
                                <video 
                                    key={videoUrl}
                                    src={getFullVideoUrl(videoUrl)} 
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                                        <Play size={40} className="text-primary ml-1" weight="fill" />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Awaiting Video Stream</span>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* BOTTOM: UPCOMING QUEUE */}
                    <Card className="flex-1 rounded-3xl flex flex-col border shadow-xl shadow-primary/5">
                        <CardHeader className="py-5 px-8 border-b">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.25em] flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                </div>
                                Next in Line
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 flex items-center justify-center overflow-hidden p-0">
                            <div className="flex gap-6 px-8 py-4 overflow-x-auto w-full custom-scrollbar no-scrollbar">
                                {UPCOMING_QUEUE.length > 0 ? (
                                    UPCOMING_QUEUE.map((item: { ticket: string, category: string, type: string }, index: number) => (
                                        <div 
                                            key={index} 
                                            className={cn(
                                                "shrink-0 w-56 h-32 rounded-3xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden transition-all hover:scale-110",
                                                getTicketStyle(item.type)
                                            )}
                                        >
                                            <div className="text-4xl font-black tabular-nums tracking-tighter mb-1">{item.ticket}</div>
                                            <div className={cn("text-[10px] font-black uppercase tracking-widest", getLabelStyle(item.type))}>
                                                {item.category}
                                            </div>
                                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-current opacity-20" />
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-sm font-medium text-muted-foreground opacity-50 uppercase tracking-widest">No upcoming tickets</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
