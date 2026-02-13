"use client";
import { useState } from 'react';
import Image from 'next/image'
import {
    MdDashboard,
    MdDescription,
    MdPhone,
    MdMonitor,
    MdLogout,
    MdSupportAgent,
    MdSettings,
    MdPeople,
    MdPersonAdd,
    MdSearch,
    MdFilterList,
    MdAccessTime,
    MdCheckCircle,
    MdCancel,
    MdPendingActions,
    MdOpenInNew,
} from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Badge } from "@/components/ui/badge"

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

// START OF RELEASING DESIGN
export default function ReleasingAdmin() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [ticketsToRelease, setTicketsToRelease] = useState('');

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
                                    {/*FOR ADMIN*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/dashboard'>
                                                <MdDashboard size={20} className="text-emerald-700" />
                                                <span>Admin Dashboard</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR RELEASING*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='/releasing'>
                                                <MdDescription size={20} className="text-emerald-700" />
                                                <span>Releasing</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR CALL NUMBER*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <MdPhone size={20} className="text-emerald-700" />
                                                <span>Call Number</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR MONITOR*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <MdMonitor size={20} className="text-emerald-700" />
                                                <span>Monitor</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*FOR REPORTS*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <MdDescription size={20} className="text-emerald-700" />
                                                <span>Reports</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        {/*Admin Settings*/}
                        <SidebarGroup className="mt-4">
                            <SidebarGroupLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 " >
                                Admin Settings
                            </SidebarGroupLabel>

                            <SidebarGroupContent>
                                <SidebarMenu>

                                    {/*RESET SERVICES*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <span>Reset Services</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*WINDOW SETTINGS*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <span>Window Settings</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*MANAGE RELEASING*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <span>Manage Releasing</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    {/*LANE SETTINGS*/}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild className="text-emerald-900 font-medium hover:bg-emerald-200 text-base px-3 h-auto w-full justify-start">
                                            <a href='#'>
                                                <span>Lane Settings</span>
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
                                        <MdSupportAgent size={20} className="mr-2" />
                                        <span> Contact Support </span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/*LOGOUT*/}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild className="text-red-500 font-medium hover:text-red-700 hover:bg-red-50 text-base px-3 h-auto w-full justify-start">
                                    <a href="#" className="flex items-center gap-2">
                                        <MdLogout size={20} className="mr-2" />
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
                            <h1 className="text-xl font-bold text-emerald-900">Ticket Releasing</h1>
                        </div>
                        <div className='flex items-center gap-3'>
                            <div className="flex flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-sm font-bold text-emerald-300">Adreanne Sopogi
                                </span>

                                <span className="text-xs text-slate-500">Administrator</span>
                            </div>

                            <Avatar className='size-10 border-2 border-emerald-100 bg emerald-50-text-emerald 700'>
                                <AvatarFallback className="font-bold">AS</AvatarFallback>
                            </Avatar>
                        </div>
                    </header>

                    <main className='flex-1 p-6 space-y-6 bg-slate-50/50 px-10'>

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
                        <div className="flex gap-6">
                            {/* LEFT SIDE - DEPARTMENT CARDS */}
                            <div className="flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="font-medium text-sm text-emerald-700">All Departments</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto pr-2">
                                    {Array.from({ length: 20 }).map((_, idx) => {
                                        const name = departments[idx % departments.length]
                                        return (
                                            <Card 
                                                key={idx} 
                                                className={`w-[250px] overflow-hidden shadow-sm border cursor-pointer transition-all ${
                                                    selectedDepartment === name 
                                                        ? 'ring-2 ring-emerald-600 border-emerald-600' 
                                                        : 'border-slate-200 hover:border-emerald-300'
                                                }`}
                                                onClick={() => setSelectedDepartment(name)}
                                            >
                                                <div className="flex items-center gap-3 p-1">
                                                    <div className="w-1.5 h-10 rounded-full bg-emerald-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-emerald-900 truncate">{name}</div>
                                                        <div className="text-xs text-slate-500">Tickets Released: 01</div>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100 h-8 w-8">
                                                            <MdOpenInNew className="text-emerald-700" size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* RIGHT SIDE - INPUT CARD */}
                            <div className="w-80 flex-shrink-0">
                                <Card className="shadow-sm border-slate-200 sticky top-[120px]">
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

                </div>

            </SidebarProvider >

        </div >
    )
}
