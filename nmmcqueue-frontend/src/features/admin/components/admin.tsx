"use client";

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
import { HOSPITAL_ROLES } from "@/types/constants";
import { SessionUser, UserData } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Department } from "@/types/models";
import {
    Check,
    CheckCircle,
    Clock,
    FileText,
    Funnel,
    Gear,
    Headset,
    HourglassMedium,
    MagnifyingGlass,
    Phone,
    Trash,
    Users,
    XCircle,
    ArrowsDownUp,
    ArrowsDownUpIcon
} from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { approveUser, rejectUser, toggleUserStatus, updateUserRole } from "../user-actions";
import { AddUserDialog } from "./add-user-dialog";
import { StatsCard } from "./stats-card";
import { useIsMounted } from "@/hooks/use-is-mounted";

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
    const isMounted = useIsMounted();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterRole, viewPendingOnly]);

    //SORT FUNCTION
    const [sortBy, setSortBy] = useState<'name'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    }).sort((a, b) => {
        //prioritze pending users
        if (!a.isApproved && b.isApproved) return -1;
        if (a.isApproved && !b.isApproved) return 1;
        //sort alphabetically by name
        return a.name.localeCompare(b.name);
    });
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);


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

    //FILTERED USERS
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let valA = '';
        let valB = '';

        switch (sortBy) {
            case 'name':
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                break;
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    //TOGGLE HANDLER
    const handleSort = (column: 'name') => {
        if (sortBy == column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDirection('asc');
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

    if (!loggedInUser || !isMounted) return null;

    return (
        <div className="flex flex-1 flex-col">
            {/* Header Section */}
            <header className='bg-white sticky top-0 z-50 border-b px-6 py-4 flex items-center justify-between shadow-sm'>
                <div className="flex items-center gap-3">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold text-black">Admin Dashboard</h1>
                </div>
                <div className='flex items-center gap-3'>
                    <div className="hidden sm:flex sm:flex-col items-end mr-1">
                        <span className="text-sm font-bold text-black">{loggedInUser.name}</span>
                        <span className="text-xs text-black font-medium uppercase tracking-tighter">{loggedInUser.role}</span>
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
                        icon={<Users size={28} className="text-white" />}
                        color="bg-emerald-600"
                    />
                    <StatsCard
                        label="Pending Requests"
                        value={analytics.pending.toString().padStart(2, '0')}
                        icon={<HourglassMedium size={28} className="text-white" />}
                        color="bg-yellow-500"
                    />
                    <StatsCard
                        label="Active Users"
                        value={analytics.active.toString().padStart(2, '0')}
                        icon={<CheckCircle size={28} className="text-white" />}
                        color="bg-emerald-500"
                    />
                    <StatsCard
                        label="Inactive Users"
                        value={analytics.inactive.toString().padStart(2, '0')}
                        icon={<XCircle size={28} className="text-white" />}
                        color="bg-red-500"
                    />
                </div>

                {/* 🔍 Controls Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 w-full sm:w-auto px-5">
                        <div className="relative w-full sm:w-100">
                            <MagnifyingGlass className="absolute left-5 top-2 text-slate-400" size={20} />
                            <Input
                                placeholder="     Search by name, email, or dept..."
                                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto mb-3 px-5 py-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="text-black border-slate-200">
                                    <Funnel size={18} className="mr-2" /> {filterRole}
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
                            {viewPendingOnly ? <Users size={18} className="mr-2" /> : <Clock size={18} className="mr-2" />}
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
                                <TableHead className="w-[300px] font-semibold text-gray-700">Staff Info</TableHead>
                                <TableHead className="font-semibold text-gray-700">Department</TableHead>
                                <TableHead className="font-semibold text-gray-700">System Role</TableHead>
                                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col py-1">
                                            <span className="font-bold text-black text-base">{user.name}</span>
                                            <span className="text-xs text-black">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-black">{user.department}</TableCell>
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
                                                    <Check size={18} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(user.id)}
                                                    className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                            <span className='text-sm text-slate-500 font-medium'>
                                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                            </span>
                            <div className='flex gap-2'>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>

                    )}
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
        case 'CLINIC_CALLER': return <Phone size={14} className="mr-1" />;
        case 'WINDOW_CLERK': return <FileText size={14} className="mr-1" />;
        case 'ADMIN': return <Gear size={14} className="mr-1" />;
        case 'TRIAGE_NURSE': return <Headset size={14} className="mr-1" />;
        default: return <Users size={14} className="mr-1" />;
    }
}