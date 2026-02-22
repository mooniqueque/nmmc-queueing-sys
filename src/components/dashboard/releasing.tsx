"use client";

import { useState } from 'react';
import {
    MdFilterList,
    MdOpenInNew,
    MdSearch,
} from 'react-icons/md';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

const departments = [
    'Animal Bite', 'Cardiology', 'Dental', 'EC', 'ENT', 'Eye Care',
    'Fam Med', 'Geriatric Med', 'IM Nephrology', 'Internal Med',
    'Laboratory', 'LC Adult',
]

export default function ReleasingDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [ticketsToRelease, setTicketsToRelease] = useState('');

    return (
        <div className='flex flex-1 flex-col h-full'>
            {/* HEADER */}
            <header className='bg-white sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-emerald-900">Ticket Releasing</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="flex flex-col items-end mr-1 hidden sm:flex">
                        <span className="text-sm font-bold text-emerald-300">
                            Adreanne Sopogi
                        </span>
                        <span className="text-xs text-slate-500">Administrator</span>
                    </div>

                    <Avatar className='size-10 border-2 border-emerald-100 bg emerald-50-text-emerald 700'>
                        <AvatarFallback className="font-bold">AS</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10 overflow-y-auto'>
                {/* HEADER SECTION */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-emerald-800">Ticket Releasing</h2>
                        <p className="text-sm text-muted-foreground">Manage and release tickets by department</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-[300px]">
                            <div className="relative w-full">
                                <div className="absolute left-3 top-2.5 text-slate-400">
                                    <MdSearch size={20} />
                                </div>
                                <Input
                                    placeholder="Search departments....."
                                    className="pl-10 bg-white border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button variant="outline" className="text-slate-600 border-slate-200">
                            <MdFilterList size={18} className="mr-2" /> Sort
                        </Button>

                        <Button variant="outline" className="text-slate-600 border-slate-200">
                            <MdFilterList size={18} className="mr-2" /> Filter
                        </Button>
                    </div>
                </div>

                {/* TWO COLUMN LAYOUT */}
                <div className="flex gap-6 h-[calc(100vh-200px)]">
                    {/* LEFT SIDE - DEPARTMENT CARDS */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-4">
                            <h3 className="font-medium text-sm text-emerald-700">All Departments</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2 pb-6">
                            {Array.from({ length: 20 }).map((_, idx) => {
                                const name = departments[idx % departments.length]
                                return (
                                    <Card
                                        key={idx}
                                        className={`w-full shadow-sm border h-[90px] cursor-pointer transition-all hover:shadow-md ${selectedDepartment === name
                                            ? 'ring-2 ring-emerald-600 border-emerald-600'
                                            : 'border-slate-200 hover:border-emerald-300'
                                            }`}
                                        onClick={() => setSelectedDepartment(name)}
                                    >
                                        <div className="flex items-center justify-between h-full px-6">
                                            {/* Left side: Dept Name */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-12 rounded-full bg-emerald-600 flex-shrink-0" />
                                                <span className="font-bold text-lg text-emerald-950 truncate max-w-[200px]">
                                                    {name}
                                                </span>
                                            </div>

                                            {/* Right side: Circular Indicator */}
                                            {/* Logic: > 0 (Red/Loaded), 0 (Green/Available) */}
                                            <div className={`
                                                flex items-center justify-center w-12 h-12 rounded-full border-2 text-sm font-bold shadow-inner 
                                                ${idx % 2 !== 0
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'}
                                            `}>
                                                {idx % 2 !== 0 ? '12' : '0'}
                                            </div>
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>

                    {/* RIGHT SIDE - INPUT CARD */}
                    <div className="w-80 flex-shrink-0">
                        <Card className="shadow-sm border-slate-200 sticky top-0">
                            <CardHeader className="border-b border-slate-200">
                                <CardTitle className="text-lg text-emerald-900">Release Tickets</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {/* SELECTED DEPARTMENT DISPLAY */}
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-2">Selected Department</label>
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                                        <p className="text-sm font-medium text-emerald-900">
                                            {selectedDepartment || 'No department selected'}
                                        </p>
                                    </div>
                                </div>

                                {/* NUMBER INPUT */}
                                <div>
                                    <label htmlFor="tickets" className="text-sm font-semibold text-slate-700 block mb-2">
                                        Number of Tickets to Release
                                    </label>
                                    <Input
                                        id="tickets"
                                        type="number"
                                        placeholder="Enter number..."
                                        value={ticketsToRelease}
                                        onChange={(e) => setTicketsToRelease(e.target.value)}
                                        className="bg-white border-slate-200"
                                        min="0"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Enter the number of tickets to release for this department</p>
                                </div>

                                {/* SUBMIT BUTTON */}
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
                                    disabled={!selectedDepartment || !ticketsToRelease}
                                >
                                    Release Tickets
                                </Button>

                                {/* RESET BUTTON */}
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-200"
                                    onClick={() => {
                                        setSelectedDepartment('')
                                        setTicketsToRelease('')
                                    }}
                                >
                                    Clear
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </main>
        </div >
    )
}
