"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MdPlayArrow, MdAccessTime, MdPeople } from "react-icons/md";

// Mock Data
const NOW_SERVING = {
    ticket: "P-024",
    counter: "Counter 1",
    department: "Priority Lane",
};

const REGULAR_QUEUE = [
    { ticket: "A-125", status: "Waiting" },
    { ticket: "A-126", status: "Waiting" },
    { ticket: "A-127", status: "Waiting" },
    { ticket: "A-128", status: "Waiting" },
    { ticket: "B-005", status: "On-Hold" },
    { ticket: "C-012", status: "Waiting" },
];

const PRIORITY_QUEUE = [
    { ticket: "P-025", status: "Child / Pedia" },
    { ticket: "F-001", status: "Fast Track" },
    { ticket: "ER-012", status: "ER-Ref" },
    { ticket: "P-026", status: "Child / Pedia" },
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

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10 border-b border-emerald-100/50">
                <div className="flex items-center gap-4">
                    {/* Logo placeholders */}
                    {/* Logos */}
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

            {/* MAIN CONT */}
            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">

                {/* LEFT QUEUE LIST*/}
                <div className="lg:col-span-1 flex flex-col gap-6 h-full">
                    {/* Now Serving Card */}
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ring-emerald-100/50 bg-white relative group h-1/3 flex flex-col">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-3">
                            <CardTitle className=" text-emerald-800 uppercase tracking-wider text-sm font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Now Serving
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center flex-1 py-4 text-center space-y-2 z-10">
                            <div className="text-[5rem] sm:text-[6rem] font-black text-emerald-900 leading-none drop-shadow-sm tracking-tighter">
                                {NOW_SERVING.ticket}
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-emerald-700 uppercase">{NOW_SERVING.counter}</div>
                                <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{NOW_SERVING.department}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NEXT QUEUE */}
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ring-emerald-100/50 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-3 sticky top-0">
                            <CardTitle className="text-slate-700 uppercase tracking-wider text-sm font-bold flex items-center gap-2">
                                <MdPeople size={16} />
                                Regular Queue
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="divide-y divide-slate-100">
                                {REGULAR_QUEUE.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 hover:bg-emerald-50/50 transition-colors">
                                        <span className="text-3xl font-bold text-slate-700 font-mono tracking-tight">{item.ticket}</span>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT VIDEO */}
                <div className="lg:col-span-2 flex flex-col gap-6 h-full">

                    {/* VID PLACEHOLDER */}
                    <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-black relative group flex-1 min-h-[400px]">
                        {/* Thumbnail / overlay */}
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                                <MdPlayArrow size={64} className="text-white ml-2" />
                            </div>
                            <div className="absolute bottom-6 left-6 text-white/50 text-sm font-medium">Promtional Video Area</div>
                        </div>
                    </Card>

                    {/* PRIORITY QUEUE */}
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ring-red-100/50 bg-white h-1/4 flex flex-col">
                        <CardHeader className="bg-white border-b border-slate-50 py-3 px-6">
                            <CardTitle className="text-emerald-800 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-800 border-b-[6px] border-b-transparent"></div>
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-emerald-800 border-b-[6px] border-b-transparent"></div>
                                </div>
                                Priority / Special Lane
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center flex-1 p-0 overflow-x-auto custom-scrollbar px-4">
                            <div className="flex gap-4 min-w-full px-2">
                                {PRIORITY_QUEUE.map((item, index) => (
                                    <div key={index} className="flex-shrink-0 w-48 h-28 bg-emerald-50 rounded-xl flex flex-col items-center justify-center border border-emerald-100 shadow-sm relative overflow-hidden group">
                                        <div className="text-4xl font-extrabold text-gray-800 tracking-tight z-10">{item.ticket}</div>
                                        <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1 z-10">{item.status}</div>

                                        {/* Active Indicator Line */}
                                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-300 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
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
