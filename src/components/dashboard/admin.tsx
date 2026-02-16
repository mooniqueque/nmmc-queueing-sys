"use client";
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image'
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
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
    MdPendingActions
} from 'react-icons/md';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const users = [
    { id: 1, name: "Andreanna Gorres", date: "01/01/26", service: "Animal Bite", role: "Caller", status: "Active" },
    { id: 2, name: "Aljo Nicolo Andina", date: "01/01/26", service: "X-RAY", role: "Releasing", status: "Inactive" },
    { id: 3, name: "Karl Valmores", date: "01/01/26", service: "X-RAY", role: "Pending", status: "Pending" },
    { id: 4, name: "Maria Clara", date: "01/02/26", service: "Triage", role: "Triage Nurse", status: "Active" },
    { id: 5, name: "Juan Dela Cruz", date: "01/02/26", service: "Admin", role: "Admin", status: "Active" },
]

// START OF DASHBOARD DESIGN
export default function AdminDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All Users');


    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||

            user.service.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterRole === 'All Users' || user.role === filterRole;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            {/*MAIN CONTAINER*/}
            <div className='flex flex-1 flex-col'>

                {/*HEADER*/}
                <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <h1 className="text-xl font-bold text-emerald-900">Admin Dashboard</h1>
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

                <main className='flex- p-6 space-y-6 bg-slate-50/50 px-10'>

                    {/*STATISTICS*/}
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                        <StatsCard label="Total System User" value="58" icon={<MdPeople size={28} className="text-white" />} color="bg-emerald-600" />
                        <StatsCard label="Pending Requests" value="06" icon={<MdPendingActions size={28} className="text-white" />} color="bg-yellow-500" />
                        <StatsCard label="Active Users" value="01" icon={<MdCheckCircle size={28} className="text-white" />} color="bg-emerald-500" />
                        <StatsCard label="Inactive Users" value="01" icon={<MdCancel size={28} className="text-white" />} color="bg-red-500" />
                    </div>

                    {/*SEARCH, ALL USERS, SORT, PENDING USERS, ADD USERS*/}
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-72">
                                <div className="absolute left-3 top-2.5 text-slate-400">
                                    <MdSearch size={20} />
                                </div>
                                <Input placeholder="Search.... " className="pl-10 bg-slate-50 border-slate-200"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="...">
                                        {filterRole === 'All Users' ? <MdPeople size={18} className="mr-2" /> : getRoleIcon(filterRole)} {filterRole}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setFilterRole('All Users')}>All Users</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterRole('Admin')}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterRole('Caller')}>Caller</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterRole('Releasing')}>Releasing</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterRole('Nurse Triage')}>Nurse Triage</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="outline" className="text-slate-600 border-slate-200">
                                <MdFilterList size={18} className="mr-2" /> Sort
                            </Button>

                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-md shadow-yellow-200">
                                <MdAccessTime size={18} className="mr-2" /> Pending Users
                            </Button>

                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-200">
                                <MdPersonAdd size={18} className="mr-2" /> Add Users
                            </Button>
                        </div>
                    </div>

                    {/*TABLE*/}
                    <Card className="shadow-sm border-0 overflow-hidden ring-1 ring-slate-200 px-4" >
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                    <TableHead className="w-[300px] font-semibold text-slate-600"> User Details </TableHead>
                                    <TableHead className="font-semibold text-slate-600">Service/Clinic</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Roles</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Account Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="font-bold text-emerald-950 text-base">Andreanna Gorres</span>
                                            <span className="text-xs text-slate-400 font-medium">Registered: 01/01/26</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-800">Animal Bite</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 px-3 py-1 font-medium">
                                            Caller
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-white text-emerald-600 border border-emerald-500 shadow-none hover:bg-emerald-50 px-3 py-1 font-medium flex w-fit items-center gap-1">
                                            <MdCheckCircle size={14} /> Active
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="font-bold text-emerald-950 text-base">Aljo Nicolo Andina</span>
                                            <span className="text-xs text-slate-400 font-medium">Registered: 01/01/26</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-800">X-RAY</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1 font-medium">
                                            Releasing
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white text-red-500 border-red-200 hover:bg-red-50 px-3 py-1 font-medium flex w-fit items-center gap-1">
                                            <MdCancel size={14} /> Inactive
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="font-bold text-emerald-950 text-base">Karl Valmores</span>
                                            <span className="text-xs text-slate-400 font-medium">Registered: 01/01/26</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-800">X-RAY</TableCell>
                                    <TableCell>
                                        {/* Empty role example */}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white text-emerald-500 border-emerald-300 hover:bg-emerald-50 px-3 py-1 font-medium flex w-fit items-center gap-1">
                                            <MdAccessTime size={14} /> Pending
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Card>
                </main>
            </div>
        </div >
    )
}
{/*ROLE ICONS*/ }
function getRoleIcon(role: string) {
    switch (role) {
        case 'Caller': return <MdPhone size={14} className="mr-1" />;
        case 'Releasing': return <MdDescription size={14} className="mr-1" />;
        case 'Admin': return <MdSettings size={14} className="mr-1" />;
        case 'Triage Nurse': return <MdSupportAgent size={14} className="mr-1" />;
        default: return <MdPeople size={14} className="mr-1" />;
    }
}

{/*FOR STATS CARD*/ }
function StatsCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <Card className='shadow-sm border-0 ring-1 ring-slate-100 px-4'>
            <div className="flex items-center p-3 gap-3">
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-md shadow-emerald-100/50`}>
                    {icon}
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</p>
                    <h3 className="text-3xl font-bold text-slate-800 leading-none">{value}</h3>
                </div>
            </div>
        </Card>
    )
}