"use client";

import { Card } from "@/components/ui/card";
import { CallOverlay } from "@/features/monitoring/components/call-overlay";
import { useWindowMonitor } from "@/features/monitoring/hooks/use-window-monitor";
import { useCurrentTime } from "@/shared/hooks/use-current-time";
import { API_URL } from "@/lib/api";
import { Play } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function WindowMonitor() {
    const currentTime = useCurrentTime();
    const { windows, upcoming, loading, currentAnnouncement } = useWindowMonitor();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Fetch securely from the Public monitor API
        fetch(`${API_URL}/monitor/departments-videos`)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data) {
                    const dept = json.data.find((d: { name: string; videoUrl: string }) => d.name === 'REGISTRATION');
                    if (dept) setVideoUrl(dept.videoUrl || null);
                }
            })
            .catch(err => console.error("Failed to load department video", err));
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
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
            <CallOverlay callData={currentAnnouncement} />
            {/* MINIMALIST HEADER */}
            <header className="bg-white px-8 py-5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200 w-full shrink-0 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <Image src="/doh-logo.svg" alt="DOH" width={48} height={48} className="object-contain" />
                        <Image src="/nmmc-logo.png" alt="NMMC" width={48} height={48} className="object-contain" />
                    </div>
                    <div>
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none mb-1">
                            CASHIER / REGISTRATION WINDOWS
                        </h2>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Northern Mindanao Medical Center
                        </h1>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end justify-center">
                    <div className="text-2xl font-bold tabular-nums tracking-tight text-emerald-700">
                        {currentTime ? formatDate(currentTime) : ''} | {currentTime ? formatTime(currentTime) : ''}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-10 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden max-w-[1800px] mx-auto w-full">
                {/* LEFT COLUMN: CALLING LIST IN A CLEAN SHADCN CARD */}
                <Card className="lg:col-span-5 flex flex-col h-full overflow-hidden shadow-xl shadow-primary/5 border rounded-3xl bg-card">
                    <div className="flex justify-between px-8 py-5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xl">
                        <span>Service Window</span>
                        <span>Now Serving</span>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-lg">Loading Monitor...</div>
                        ) : windows.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-lg">No active windows</div>
                        ) : windows.map((window, index) => (
                            <div key={index} className="flex flex-row items-center justify-between px-4 py-3 border-b-2 border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-2xl px-5 font-bold text-slate-800 tracking-tight">
                                        {window.windowName}
                                    </span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {window.displayTicket ? (
                                        <>
                                            <span className="text-3xl font-black text-emerald-600 tracking-tighter tabular-nums drop-shadow-sm leading-none flex gap-2">
                                                {window.displayTicket}
                                            </span>
                                            {window.priorityClass && false && (
                                                <span className="text-sm font-extrabold text-slate-400 uppercase tracking-[0.2em] mt-3">
                                                    Class: {window.priorityClass}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-3xl font-bold text-slate-300 uppercase tracking-widest italic py-4">Waiting...</span>
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

                    {/* UPCOMING WAITLIST - COMPACT FOR PUBLIC VIEWING */}
                    <Card className="p-4 bg-white shadow-md border-2 border-slate-100 rounded-xl flex flex-col justify-center shrink-0">
                        <div className="flex items-center justify-between mb-3 border-b-2 border-slate-100 pb-2">
                            <div>

                                <p className="text-xl font-bold text-slate-800 tracking-tight leading-none">Next in Line</p>
                            </div>
                            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold uppercase tracking-widest ring-1 ring-emerald-200">
                                {upcoming.length} Waiting
                            </div>
                        </div>

                        <div className="flex justify-start gap-4 flex-wrap">
                            {upcoming.length > 0 ? upcoming.map((num, i) => (
                                <div key={i} className="px-6 py-2 bg-slate-50 border-2 border-slate-200 shadow-sm rounded-lg text-slate-900 font-black text-4xl tracking-tighter tabular-nums drop-shadow-sm">
                                    {num}
                                </div>
                            )) : (
                                <span className="text-slate-400 font-medium italic text-lg py-2">No upcoming patients.</span>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            {/* MINIMALIST MARQUEE FOOTER */}
            <footer className="bg-white border-t border-slate-200 py-5 px-5 shrink-0 overflow-hidden whitespace-nowrap shadow-sm">
                <div className="animate-marquee inline-block">
                    <span className="text-slate-600 font-bold text-lg uppercase tracking-widest mx-16">Welcome to Northern Mindanao Medical Center</span>
                    <span className="text-emerald-700 font-bold text-lg uppercase tracking-[0.2em] mx-16">Health is Wealth • Serbisyo Para sa Lahat</span>
                    <span className="text-slate-600 font-bold text-lg uppercase tracking-widest mx-16">Service Hours: 8:00 AM - 5:00 PM</span>
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
