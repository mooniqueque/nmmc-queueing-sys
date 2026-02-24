"use client";

import { HOSPITAL_ROLES } from "@/lib/constants/hospital";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import {
    MdAccessTime,
    MdCancel,
    MdCheck,
    MdCheckCircle,
    MdDelete,
    MdFilterList,
    MdPendingActions,
    MdPeople,
    MdSearch,
} from 'react-icons/md';
import { approveUser, rejectUser, toggleUserStatus, updateUserRole } from "../_actions/user-actions";

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { SessionUser, UserData } from "@/lib/types/user";
import { Department } from "@prisma/client";
import { MdDescription, MdPhone, MdSettings, MdSupportAgent } from "react-icons/md";
import { AddUserDialog } from "./add-user-dialog";
import { StatsCard } from "./stats-card";

/**
 * COORDINATOR COMPONENT: AdminDashboard
 */
export default function AdminDashboard({
    loggedInUser,
    initialUsers = [],
    departments = []
}: {
    loggedInUser?: SessionUser,
    initialUsers?: UserData[],
    departments?: Department[]
}) {
    const router = useRouter();

    // 1. STATE & FILTERS
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('All Users');
    const [viewPendingOnly, setViewPendingOnly] = useState(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // 2. DATA CALCULATIONS (Derived State)
    const analytics = {
        total: initialUsers.length,
        pending: initialUsers.filter(u => !u.isApproved).length,
        active: initialUsers.filter(u => u.isApproved && u.isActive).length,
        inactive: initialUsers.filter(u => u.isApproved && !u.isActive).length
    };

    // 3. FILTERING (Let React Compiler handle memoization)
    const users = initialUsers || [];
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.employeeID.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterRole === 'All Users' || user.role === filterRole;
        const matchesPending = viewPendingOnly ? !user.isApproved : true;

        return matchesSearch && matchesFilter && matchesPending;
    });

    // 4. ACTION HANDLERS
    const handleApprove = async (userId: string) => {
        if (confirm("Are you sure you want to approve this user?")) {
            const result = await approveUser(userId);
            if (result.success) router.refresh();
            else alert(result.error);
        }
    };

    const handleReject = async (userId: string) => {
        if (confirm("Are you sure you want to delete this requisition?")) {
            const result = await rejectUser(userId);
            if (result.success) router.refresh();
            else alert(result.error);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingUserId(userId);
        try {
            const result = await toggleUserStatus(userId, !currentStatus);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    if (!loggedInUser) return null;

    return (
        <div className="flex flex-1 flex-col">
            {/* Header Section */}
            <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-emerald-900">Admin Dashboard</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="hidden sm:flex sm:flex-col items-end mr-1">
                        <span className="text-sm font-bold text-emerald-900">{loggedInUser.name}</span>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-tighter">{loggedInUser.role}</span>
                    </div>
                    <Avatar className='size-10 border-2 border-emerald-100 ring-2 ring-emerald-50'>
                        <AvatarFallback className="font-bold bg-emerald-50 text-emerald-700">
                            {loggedInUser.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>

            <main className='p-6 space-y-6 bg-slate-50/50 px-10'>

                {/* ANALYTICS */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3'>
                    <StatsCard
                        label="Total System User"
                        value={analytics.total.toString().padStart(2, '0')}
                        icon={<MdPeople size={28} className="text-white" />}
                        color="bg-emerald-600"
                    />
                    <StatsCard
                        label="Pending Requests"
                        value={analytics.pending.toString().padStart(2, '0')}
                        icon={<MdPendingActions size={28} className="text-white" />}
                        color="bg-yellow-500"
                    />
                    <StatsCard
                        label="Active Users"
                        value={analytics.active.toString().padStart(2, '0')}
                        icon={<MdCheckCircle size={28} className="text-white" />}
                        color="bg-emerald-500"
                    />
                    <StatsCard
                        label="Inactive Users"
                        value={analytics.inactive.toString().padStart(2, '0')}
                        icon={<MdCancel size={28} className="text-white" />}
                        color="bg-red-500"
                    />
                </div>

                {/* 🔍 Controls Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <MdSearch className="absolute left-3 top-2.5 text-slate-400" size={20} />
                            <Input
                                placeholder="Search by name, email, or dept..."
                                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-slate-600 border-slate-200">
                                    <MdFilterList size={18} className="mr-2" /> {filterRole}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {['All Users', 'ADMIN', 'CLINIC_CALLER', 'WINDOW_CLERK', 'TRIAGE_NURSE'].map(role => (
                                    <DropdownMenuItem key={role} onClick={() => setFilterRole(role)}>
                                        {role}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            onClick={() => setViewPendingOnly(!viewPendingOnly)}
                            className={cn(
                                "font-semibold shadow-md transition-all active:scale-95",
                                viewPendingOnly
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                                    : "bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200"
                            )}
                        >
                            {viewPendingOnly ? <MdPeople size={18} className="mr-2" /> : <MdAccessTime size={18} className="mr-2" />}
                            {viewPendingOnly ? "Show All Users" : "Pending Users"}
                        </Button>

                        <AddUserDialog departments={departments} />
                    </div>
                </div>

                {/* 📋 User Table */}
                <Card className="shadow-sm border-0 overflow-hidden ring-1 ring-slate-200 px-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                                <TableHead className="w-[300px] font-semibold text-slate-600">Staff Info</TableHead>
                                <TableHead className="font-semibold text-slate-600">Department</TableHead>
                                <TableHead className="font-semibold text-slate-600">System Role</TableHead>
                                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="font-bold text-emerald-900 text-base">{user.name}</span>
                                            <span className="text-xs text-slate-500">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-800">{user.department}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 px-2 hover:bg-slate-100 transition-all",
                                                        updatingUserId === user.id && "animate-pulse opacity-50 pointer-events-none"
                                                    )}
                                                >
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 uppercase px-3 py-1 font-semibold text-[10px] cursor-pointer hover:border-emerald-300">
                                                        {getRoleIcon(user.role)} {user.role.replace('_', ' ')}
                                                    </Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                {HOSPITAL_ROLES.map(({ value, label }) => (
                                                    <DropdownMenuItem
                                                        key={value}
                                                        onClick={() => handleUpdateRole(user.id, value)}
                                                        className={cn(
                                                            "flex items-center gap-2 text-xs font-medium",
                                                            user.role === value && "bg-emerald-50 text-emerald-700 font-bold"
                                                        )}
                                                    >
                                                        {getRoleIcon(value)} {label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        {user.isApproved ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 px-2 hover:bg-slate-100 transition-all",
                                                            updatingUserId === user.id && "animate-pulse opacity-50 pointer-events-none"
                                                        )}
                                                    >
                                                        <Badge className={cn(
                                                            "font-bold cursor-pointer hover:opacity-80 transition-opacity",
                                                            user.isActive
                                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                : "bg-red-50 text-red-600 border-red-100"
                                                        )}>
                                                            {user.isActive ? "ACTIVE" : "INACTIVE"}
                                                        </Badge>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(user.id, user.isActive)}>
                                                        {user.isActive ? "Set as Inactive" : "Set as Active"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Badge className="bg-yellow-50 text-yellow-600 border-yellow-100 font-bold">
                                                PENDING
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {!user.isApproved && (
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleApprove(user.id)}
                                                    className="h-8 w-8 p-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <MdCheck size={18} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(user.id)}
                                                    className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    <MdDelete size={18} />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </main>
        </div>
    );
}

/**
 * HELPER: Role Icon Mapping
 */
function getRoleIcon(role: string) {
    switch (role) {
        case 'CLINIC_CALLER': return <MdPhone size={14} className="mr-1" />;
        case 'WINDOW_CLERK': return <MdDescription size={14} className="mr-1" />;
        case 'ADMIN': return <MdSettings size={14} className="mr-1" />;
        case 'TRIAGE_NURSE': return <MdSupportAgent size={14} className="mr-1" />;
        default: return <MdPeople size={14} className="mr-1" />;
    }
}