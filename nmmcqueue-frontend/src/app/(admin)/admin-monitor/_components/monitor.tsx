"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock, Users } from "@phosphor-icons/react";
import { SidebarTrigger } from '@/components/ui/sidebar';

// Mock Data
const NOW_SERVING = {
    ticket: "P-024",
    counter: "Counter 1",
    department: "Priority Lane",
};

const SERVING_LIST = [
    { service: "Priority-NEW", ticket: "PRIONEW-11" },
    { service: "Priority-OLD", ticket: "PRIOOLD-2" },
    { service: "Regular-NEW", ticket: "REGNEW-18" },
    { service: "Malasakit-PHIC", ticket: "PHIC-14" },
    { service: "Regular-OLD", ticket: "REGOLD-2" }, // Add more if needed
];

const UPCOMING_QUEUE = [
    { ticket: "A-129", category: "Regular-NEW", type: "regular" },
    { ticket: "P-027", category: "Child / Pedia", type: "priority" },
    { ticket: "A-130", category: "Regular-OLD", type: "regular" },
    { ticket: "ER-013", category: "ER-Ref", type: "urgent" },
];

export default function QueueMonitor() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
        <div className="w-full h-screen bg-white flex flex-col font-sans text-slate-800 overflow-hidden">
            {/* HEADER */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-emerald-100/50 w-full shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="w-12 h-12 text-emerald-800 scale-125" />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative w-15 h-15">
                            <Image
                                src="/doh-logo.svg"
                                alt="Department of Health Logo"
                                fill
                                className="object-contain drop-shadow-md"
                            />
                        </div>
                        <div className="relative w-16 h-16">
                            <Image
                                src="/nmmc-logo.png"
                                alt="NMMC Logo"
                                fill
                                className="object-contain drop-shadow-md"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-widest leading-none">Department of Health</h2>
                        <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Northern Mindanao Medical Center</h1>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black text-emerald-800 tabular-nums tracking-tight leading-none">
                        {formatTime(currentTime)}
                    </div>
                    <div className="text-sm font-bold text-emerald-600 uppercase tracking-wider mt-1">
                        {formatDate(currentTime)}
                    </div>
                </div>
            </header>


            <main className="flex-1 px-6 pt-5 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden pb-6">
                {/* LEFT COLUMN: Service List */}
                <div className="col-span-1 flex flex-col gap-3 h-full overflow-hidden">
                    <div className="flex justify-between px-4 py-3 bg-emerald-800 text-white rounded-t-xl font-bold uppercase tracking-wider text-sm shadow-md shrink-0">
                        <span>Service</span>
                        <span>Now Serving</span>
                    </div>

                    {/* The List of Cards */}
                    <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2 pb-2">
                        {SERVING_LIST.map((item, index) => (
                            <Card key={index} className="border-0 shadow-sm rounded-lg overflow-hidden ring-1 ring-emerald-50 bg-white hover:shadow-md transition-all shrink-0">
                                <CardContent className="p-0 flex flex-row items-stretch h-14">
                                    {/* Service Name (Left Side) - Slightly darker bg for contrast */}
                                    <div className="w-1/2 flex items-center justify-start px-4 border-r border-slate-100 ">
                                        <span className="text-sm font-bold uppercase leading-tight line-clamp-2">
                                            {item.service}
                                        </span>
                                    </div>
                                    {/* Ticket Number (Right Side) */}
                                    <div className="w-1/2 flex items-center justify-center bg-white">
                                        <span className="text-2xl font-black text-emerald-800 tracking-tighter">
                                            {item.ticket}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Video & Upcoming */}
                <div className="col-span-2 flex flex-col gap-6 h-full">

                    {/* TOP: Video Player */}
                    <Card className="h-[65%] bg-black rounded-xl overflow-hidden relative shadow-lg group">
                        {/* Thumbnail / Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                                <Play size={50} className="text-white ml-2" weight="fill" />
                            </div>
                            <div className="absolute bottom-4 left-6 text-white/50 text-xs font-medium uppercase tracking-widest">Promotional Video</div>
                        </div>
                    </Card>

                    {/* BOTTOM LIST, UPCOMING QUEUE*/}
                    <Card className="flex-1 bg-white border-0 shadow-md rounded-lg flex flex-col">
                        <CardHeader className="bg-white py-2 px-6">
                            <CardTitle className="text-slate-700 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                                <div className="flex space-x-1">
                                    {/*ARROW*/}
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-600 border-b-[6px] border-b-transparent"></div>
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-600 border-b-[6px] border-b-transparent"></div>
                                </div>
                                Next in Line / Upcoming
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="flex gap-4 min-w-full px-2 py-2">
                                {UPCOMING_QUEUE.map((item, index) => (
                                    <div key={index} className={`flex-shrink-0 w-48 h-28 rounded-xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden group transition-colors ${getTicketStyle(item.type)}`}>
                                        <div className="text-2xl font-extrabold tracking-tight z-10">{item.ticket}</div>
                                        <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 z-10 ${getLabelStyle(item.type)}`}>{item.category}</div>

                                        {/* Indicator Line */}
                                        <div className={`absolute bottom-0 left-0 w-full h-1 bg-current opacity-30`}></div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>


        </div>
    );
}
