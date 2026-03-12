"use client";

import {
    ArrowSquareOut,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SessionUser } from '@/types/auth';
import { Department } from '@/types/models';

const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

export default function ReleasingDashboard({
    loggedInUser,
    departments = [],
    queueOptionsByDepartment = {}
}: {
    loggedInUser: SessionUser;
    departments: Department[];
    queueOptionsByDepartment?: Record<string, string[]>;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [ticketsToRelease, setTicketsToRelease] = useState('');
    const [selectedQueueOption, setSelectedQueueOption] = useState('');

    // Filter departments based on search query
    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get queue options for selected department
    const queueOptions = selectedDepartment
        ? (queueOptionsByDepartment[normalizeDepartmentKey(selectedDepartment)] ?? DEFAULT_QUEUE_OPTIONS)
        : [];

    return (
        <div className='flex flex-1 flex-col h-full'>
            {/* HEADER */}
            <header className='bg-white sticky top-0 z-10 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-emerald-900">Ticket Releasing</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="flex flex-col items-end mr-1 sm:flex">
                        <span className="text-sm font-bold text-emerald-900">
                            {loggedInUser.name}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-tighter">{loggedInUser.role.replace('_', ' ')}</span>
                    </div>

                    <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50'>
                        <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                            {loggedInUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10 overflow-y-auto'>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-emerald-800">Releasing Dashboard</h2>
                        <p className="text-sm text-muted-foreground">Manage tickets and view department analytics</p>
                    </div>
                </div>

                {/* TWO COLUMN LAYOUT - USING PREMIUM REPORTS STYLING! */}
                <div className="flex gap-6 h-[calc(100vh-200px)] mt-4">

                    {/* LEFT SIDE - DEPARTMENT CARDS */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-4">
                            <h3 className="font-medium text-sm text-emerald-700">All Departments</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-2 pb-10 content-start auto-rows-max">
                            {filteredDepartments.length === 0 ? (
                                <div className="col-span-1 lg:col-span-2 text-center text-slate-500 mt-10 italic">
                                    No departments found matching your search.
                                </div>
                            ) : (
                                filteredDepartments.map((dept) => {
                                    return (
                                        // NOTICE THIS CLASSNAME: border-0 ring-1 ring-slate-100 matches the Reports Page!
                                        <Card
                                            key={dept.id}
                                            className={`w-full overflow-hidden cursor-pointer transition-all border-0 shadow-sm ${selectedDepartment === dept.name
                                                ? 'ring-2 ring-emerald-600 bg-emerald-50/30'
                                                : 'ring-1 ring-slate-100 hover:ring-2 hover:ring-emerald-200 bg-white'
                                                }`}
                                            onClick={() => setSelectedDepartment(dept.name)}
                                        >
                                            <div className="flex items-center gap-3 p-3">
                                                <div className="w-1.5 h-10 rounded-full bg-emerald-600 shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-sm text-emerald-900 truncate">{dept.name}</div>
                                                    <div className="text-xs text-slate-500">Tickets Released: 01</div>
                                                </div>
                                                <div className="shrink-0">
                                                    <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100 h-8 w-8">
                                                        <ArrowSquareOut className="text-emerald-700" size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE - INPUT CARD */}
                    <div className="w-80 shrink-0">
                        {/* NOTICE THIS CLASSNAME: border-0 ring-1 ring-slate-100 matches the Reports Page! */}
                        <Card className="shadow-sm border-0 ring-1 ring-slate-100 px-2 py-2 sticky top-0 bg-white">
                            <CardHeader className="border-b border-slate-100/60 pb-4">
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

                                {/* QUEUE OPTIONS */}
                                {selectedDepartment && queueOptions.length > 0 && (
                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 block mb-2">Queue Option</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {queueOptions.map((option) => (
                                                <Button
                                                    key={option}
                                                    type="button"
                                                    variant={selectedQueueOption === option ? "default" : "outline"}
                                                    className={`text-xs font-bold ${selectedQueueOption === option
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                        : 'border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                    onClick={() => setSelectedQueueOption(option)}
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

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
                                    disabled={!selectedDepartment || !ticketsToRelease || !selectedQueueOption}
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
                                        setSelectedQueueOption('')
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
