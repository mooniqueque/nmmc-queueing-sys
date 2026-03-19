"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { getDepartmentsVideos } from "@/features/monitoring/actions";
import { useCurrentTime } from "@/hooks/use-current-time";
import { Department } from "@/types/models";
import { Play } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

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
        <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
            {/* MINIMALIST HEADER */}
            <header className="bg-white px-8 py-5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200 w-full shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <Image src="/doh-logo.svg" alt="DOH" width={48} height={48} className="object-contain" />
                        <Image src="/nmmc-logo.png" alt="NMMC" width={48} height={48} className="object-contain" />
                    </div>
                    <div>
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">
                            {departmentName}
                        </h2>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Northern Mindanao Medical Center
                        </h1>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                    <div className="text-4xl font-bold tabular-nums tracking-tight text-slate-900">
                        {currentTime ? formatTime(currentTime) : ''}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                        {currentTime ? formatDate(currentTime) : ''}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden max-w-[1800px] mx-auto w-full">
                {/* LEFT COLUMN: CALLING LIST IN A CLEAN SHADCN CARD */}
                <Card className="lg:col-span-5 flex flex-col h-full overflow-hidden shadow-sm border-slate-200 rounded-xl bg-white">
                    <div className="flex justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Station Name</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Now Serving</span>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 font-medium uppercase tracking-widest text-sm">Loading Monitor...</div>
                        ) : windows.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-medium uppercase tracking-widest text-sm">No active stations</div>
                        ) : windows.map((window, index) => (
                            <div key={index} className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        Station {window.stationNo}
                                    </span>
                                    <span className="text-2xl font-bold text-slate-800 tracking-tight">
                                        {window.windowName}
                                    </span>
                                </div>
                                <div className="text-right">
                                    {window.ticketNumber ? (
                                        <span className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                                            {window.ticketNumber}
                                        </span>
                                    ) : (
                                        <span className="text-xl font-medium text-slate-300 uppercase tracking-widest italic">Waiting...</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* RIGHT COLUMN: MULTIMEDIA & ANNOUNCEMENTS */}
                <div className="lg:col-span-7 flex flex-col gap-6 h-full">

                    {/* VIDEO PLAYER */}
                    <Card className="flex-1 bg-black rounded-xl overflow-hidden relative shadow-sm border border-slate-200">
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            {videoUrl ? (
                                <video
                                    src={getFullVideoUrl(videoUrl)}
                                    className="w-full h-full object-cover opacity-90"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="size-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                                        <Play size={24} className="text-slate-500 ml-1" weight="fill" />
                                    </div>
                                    <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">Awaiting Video Loop</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* PUBLIC ANNOUNCEMENT */}
                    <Card className="p-6 bg-white shadow-sm border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Public Announcement</h3>
                            <p className="text-lg font-semibold text-slate-800 tracking-tight">Please prepare your Requirements and Valid IDs.</p>
                        </div>
                        <div className="size-10 bg-emerald-50 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </Card>
                </div>
            </main>

            {/* MINIMALIST MARQUEE FOOTER */}
            <footer className="bg-white border-t border-slate-200 py-3 px-8 shrink-0 overflow-hidden whitespace-nowrap shadow-sm">
                <div className="animate-marquee inline-block">
                    <span className="text-slate-600 font-medium text-xs uppercase tracking-widest mx-16">Welcome to Northern Mindanao Medical Center</span>
                    <span className="text-emerald-700 font-bold text-xs uppercase tracking-[0.2em] mx-16">Health is Wealth • Serbisyo Para sa Lahat</span>
                    <span className="text-slate-600 font-medium text-xs uppercase tracking-widest mx-16">Service Hours: 8:00 AM - 5:00 PM</span>
                </div>
            </footer>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 35s linear infinite;
                }
            `}</style>
        </div>
    );
}

