"use client";

import { Card, CardContent } from "@/components/ui/card";
import { getDepartmentsVideos } from "@/features/monitoring/actions";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { useCurrentTime } from "@/hooks/use-current-time";
import { API_URL } from "@/lib/api";
import { Play } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface DepartmentMonitorProps {
    slug: string;
}

export default function DepartmentMonitor({ slug }: DepartmentMonitorProps) {
    const currentTime = useCurrentTime();
    const { windows, loading } = useWindowMonitor(slug);
    const [departmentName, setDepartmentName] = useState("LOADING...");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        getDepartmentsVideos().then(res => {
            if (res.success) {
                const dept = res.data.find((d: any) => d.slug === slug || d.id === slug);
                if (dept) {
                    setDepartmentName(dept.name.toUpperCase());
                    setVideoUrl(dept.videoUrl || null);
                }
            }
        });
    }, [slug]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], {
            weekday: "long",
            month: "short",
            day: "numeric",
        }).toUpperCase();
    };

    const getFullVideoUrl = (url: string) => {
        const backendUrl = API_URL.replace('/api', '');
        return `${backendUrl}${url}`;
    };

    return (
        <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
            {/* HEADER */}
            <header className="bg-white shadow-md px-8 py-6 flex justify-between items-center sticky top-0 z-10 border-b-4 border-emerald-600 w-full shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex gap-3">
                        <div className="relative w-16 h-16">
                            <Image src="/doh-logo.svg" alt="DOH" fill className="object-contain" />
                        </div>
                        <div className="relative w-16 h-16">
                            <Image src="/nmmc-logo.png" alt="NMMC" fill className="object-contain" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-widest leading-none mb-1">{departmentName}</h2>
                        <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase">Northern Mindanao Medical Center</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-black text-emerald-800 tabular-nums tracking-tighter leading-none">
                        {currentTime ? formatTime(currentTime) : ''}
                    </div>
                    <div className="text-sm font-bold text-emerald-600 uppercase tracking-widest mt-1">
                        {currentTime ? formatDate(currentTime) : ''}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
                {/* LEFT COLUMN: CALLING LIST */}
                <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex justify-between px-6 py-4 bg-emerald-900 text-white rounded-t-2xl font-black uppercase tracking-widest text-lg shadow-xl shrink-0">
                        <span>STATION</span>
                        <span>NOW SERVING</span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-4">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading Monitor...</div>
                        ) : windows.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">No active stations</div>
                        ) : windows.map((window, index) => (
                            <Card key={index} className="border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-white hover:scale-[1.01] transition-all duration-300">
                                <CardContent className="p-0 flex flex-row items-stretch h-24">
                                    <div className="w-[60%] flex items-center justify-start px-8 bg-slate-50 border-r-2 border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black text-xl">
                                                {window.stationNo}
                                            </div>
                                            <span className="text-xl font-black text-slate-700 uppercase leading-tight tracking-tight">
                                                {window.windowName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-[40%] flex items-center justify-center bg-white">
                                        {window.ticketNumber ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-5xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                                                    {window.ticketNumber}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-bold text-slate-300 uppercase tracking-widest italic">Wait...</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: MULTIMEDIA */}
                <div className="lg:col-span-7 flex flex-col gap-8 h-full">
                    <Card className="flex-1 bg-black rounded-[2rem] overflow-hidden relative shadow-2xl group border-12 border-white ring-1 ring-slate-200">
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            {videoUrl ? (
                                <video 
                                    src={getFullVideoUrl(videoUrl)} 
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 ring-8 ring-white/20 group-hover:scale-110 transition-transform duration-500">
                                        <Play size={60} className="text-white ml-2" weight="fill" />
                                    </div>
                                    <p className="text-white/40 font-black uppercase tracking-[0.3em] text-sm group-hover:text-white/60 transition-colors">Information Video Loop</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="h-32 bg-emerald-800 text-white rounded-[2rem] shadow-xl flex items-center justify-center px-12 relative overflow-hidden">
                        <div className="z-10 text-center">
                            <p className="text-emerald-300 font-black uppercase tracking-[0.2em] text-xs mb-1">Public Announcement</p>
                            <h3 className="text-xl font-bold tracking-tight">Please prepare your Requirements and Valid IDs for faster processing.</h3>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-700/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/50 rounded-full blur-3xl -ml-16 -mb-16"></div>
                    </Card>
                </div>
            </main>

            {/* MARQUEE FOOTER */}
            <footer className="bg-emerald-950 py-3 px-8 shrink-0 overflow-hidden whitespace-nowrap">
                <div className="animate-marquee inline-block">
                    <span className="text-emerald-100 font-bold uppercase tracking-widest mx-12">Welcome to Northern Mindanao Medical Center</span>
                    <span className="text-emerald-400 font-black uppercase tracking-widest mx-12">Health is Wealth • Serbisyo Para sa Lahat</span>
                    <span className="text-emerald-100 font-bold uppercase tracking-widest mx-12">Service Hours: 8:00 AM - 5:00 PM</span>
                </div>
            </footer>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
