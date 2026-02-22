"use client";
import { useState } from 'react';
import Image from 'next/image'
import {
    SquaresFour,
    FileText,
    Phone,
    Desktop,
    SignOut,
    Headset,
    MagnifyingGlass,
    Funnel,
    ArrowSquareOut,
} from '@phosphor-icons/react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarFooter,
} from '@/components/ui/sidebar'

const departments = [
    'Animal Bite',
    'Cardiology',
    'Dental',
    'EC',
    'ENT',
    'Eye Care',
    'Fam Med',
    'Geriatric Med',
    'IM Nephrology',
    'Internal Med',
    'Laboratory',
    'LC Adult',
]

interface UserInfo {
    name: string;
    email: string;
    role: string;
}

export default function UserReleasing({ userInfo }: { userInfo: UserInfo }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            <SidebarProvider>

                {/* sidebar */}
                <Sidebar className="border-r bg-emerald-50/50">
                    <SidebarContent>
                        <div className="p-4 flex items-center gap-2 mb-4">
                            <div className="h-10 w-10 flex items-center justify-center relative">
                                <Image
                                    src="/logo.png"
                                    alt="NMMC Logo"
                                    width={40}
                                    height={40}
                                    className="rounded-full ring-2 ring-emerald-100 object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm leading-tight text-emerald-950 ml-2"> Northern Mindanao Medical Center</span>
                            </div>
                        </div>

                        {/*main nav*/}
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {/*FOR RELEASING*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/releasing'>
                                                <FileText size={20} className="text-emerald-700" />
                                                <span>Releasing</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR CALL NUMBER*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/call-number'>
                                                <Phone size={20} className="text-emerald-700" />
                                                <span>Call Number</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR MONITOR*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/user/monitor'>
                                                <Desktop size={20} className="text-emerald-700" />
                                                <span>Monitor</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    {/*SIDEBAR FOOTER*/}
                    <SidebarFooter className="border-t p-4 bg-emerald-50/30">
                        <SidebarMenu className="gap-2">

                            {/*CONTACT SUPP*/}
                            <SidebarMenuItem className="mb-2">
                                <SidebarMenuButton className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto">
                                    <a href="#" className="flex items-left gap-2">
                                        <Headset size={20} className="mr-2" />
                                        <span> Contact Support </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*LOGOUT*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start">
                                    <a href="#" className="flex items-center gap-2">
                                        <SignOut size={20} className="mr-2" />
                                        <span> Logout </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>

                {/*MAIN CONTAINER*/}
                <div className='flex flex-1 flex-col'>

                    {/*HEADER*/}
                    <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                        <div className="flex items-center gap-3">
                            <SidebarTrigger />
                            <h1 className="text-xl font-bold text-emerald-900">Ticket Status</h1>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className="hidden sm:flex flex-col items-end mr-1">
                                <span className="text-sm font-bold text-emerald-300">{userInfo.name}</span>

                                <span className="text-xs text-slate-500">Patient</span>
                            </div>

                            <Avatar className='size-10 border-2 border-emerald-100 bg-emerald-50'>
                                <AvatarFallback className="font-bold">{userInfo.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                    </header>

                    <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10'>

                        {/* HEADER SECTION */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-emerald-800">Your Ticket Status</h2>
                                <p className="text-sm text-muted-foreground">View your current position and department queue status</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 w-[300px]">
                                    <div className="relative w-full">
                                        <div className="absolute left-3 top-2.5 text-slate-400">
                                            <MagnifyingGlass size={20} />
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
                                    <Funnel size={18} className="mr-2" /> Filter
                                </Button>
                            </div>
                        </div>

                        {/* TWO COLUMN LAYOUT */}
                        <div className="flex gap-6">
                            {/* LEFT SIDE - DEPARTMENT CARDS */}
                            <div className="flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-medium text-sm text-emerald-700">Available Departments</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2">
                                    {Array.from({ length: 20 }).map((_, idx) => {
                                        const name = departments[idx % departments.length]
                                        return (
                                            <Card
                                                key={idx}
                                                className={`w-[250px] overflow-hidden shadow-sm border cursor-pointer transition-all ${selectedDepartment === name
                                                        ? 'ring-2 ring-emerald-600 border-emerald-600'
                                                        : 'border-slate-200 hover:border-emerald-300'
                                                    }`}
                                                onClick={() => setSelectedDepartment(name)}
                                            >
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="w-1.5 h-10 rounded-full bg-emerald-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-emerald-900 truncate">{name}</div>
                                                        <div className="text-xs text-slate-500">Queue Position: 01</div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100 h-8 w-8">
                                                            <ArrowSquareOut className="text-emerald-700" size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* RIGHT SIDE - TICKET INFO CARD */}
                            <div className="w-80 flex-shrink-0">
                                <Card className="shadow-sm border-slate-200 sticky top-[120px]">
                                    <CardHeader className="border-b border-slate-200">
                                        <CardTitle className="text-lg text-emerald-900">Your Ticket Info</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        {/* SELECTED DEPARTMENT DISPLAY */}
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-2">Selected Department</label>
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                                                <p className="text-sm font-medium text-emerald-900">
                                                    {selectedDepartment || 'Select a department'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* TICKET NUMBER DISPLAY */}
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-2">Your Ticket Number</label>
                                            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-md text-center">
                                                <p className="text-3xl font-bold text-blue-700">
                                                    {selectedDepartment ? `Q-${selectedDepartment.substring(0, 3).toUpperCase()}-001` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* STATUS INFO */}
                                        <div>
                                            <label className="text-sm font-semibold text-slate-700 block mb-2">Queue Status</label>
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                                <p className="text-sm text-slate-700">Estimated wait: <span className="font-semibold">15-20 minutes</span></p>
                                                <p className="text-xs text-slate-500 mt-1">You are 1st in queue</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                    </main>

                </div>

            </SidebarProvider >

        </div >
    )
}
