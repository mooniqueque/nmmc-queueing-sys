"use client";

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
import { Department, WorkStation, WorkstationType } from "@/types/models";
import {
    Check,
    CheckCircle,
    Clock,
    Funnel,
    HourglassMedium,
    MagnifyingGlass,
    Trash,
    Users,
    XCircle
} from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { approveUser, rejectUser, toggleUserStatus, updateUserRole, updateUserDepartment, updateUserWorkstation } from "../user-actions";
import { AddUserDialog } from "./add-user-dialog";
import { StatsCard } from "./stats-card";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { AdminHeader } from "@/components/layouts/admin-header";

/**
 * COORDINATOR COMPONENT: AdminDashboard
 */
export default function AdminDashboard({
    loggedInUser,
    initialUsers = [],
    departments = [],
    workstations = []
}: {
    loggedInUser?: SessionUser,
    initialUsers?: UserData[],
    departments?: Department[],
    workstations?: WorkStation[]
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
            (user.department?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.workstation?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
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

    const handleUpdateDepartment = async (userId: string, newDept: string) => {
        setUpdatingUserId(userId);
        try {
            const result = await updateUserDepartment(userId, newDept);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error);
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleUpdateWorkstation = async (userId: string, wsId: string) => {
        setUpdatingUserId(userId);
        try {
            const result = await updateUserWorkstation(userId, wsId);
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

    if (!loggedInUser || !isMounted) return null;

    return (
        <div className="flex flex-1 flex-col">
            {/* Header Section */}
            <AdminHeader 
                user={loggedInUser} 
                title="Admin Dashboard" 
            />

            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">

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

                {/* Controls Section */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:max-w-md">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Search staff, email, or department..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Funnel size={16} />
                                    <span>{filterRole === 'All Users' ? 'Roles' : filterRole}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {['All Users', 'ADMIN', 'CLINIC_CALLER', 'WINDOW_CLERK', 'TRIAGE_NURSE'].map(role => (
                                    <DropdownMenuItem key={role} onClick={() => setFilterRole(role)}>
                                        {role === 'All Users' ? 'All Roles' : role}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant={viewPendingOnly ? "default" : "outline"}
                            onClick={() => setViewPendingOnly(!viewPendingOnly)}
                            className="gap-2"
                        >
                            {viewPendingOnly ? <Users size={16} /> : <Clock size={16} />}
                            <span>{viewPendingOnly ? "All Staff" : "Review Pending"}</span>
                        </Button>

                        <AddUserDialog departments={departments} />
                    </div>
                </div>

                {/* User Table */}
                <Card className="rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px] font-semibold">Staff Info</TableHead>
                                <TableHead className="font-semibold">Assignment</TableHead>
                                <TableHead className="font-semibold">System Role</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col py-0.5">
                                            <span className="font-semibold text-foreground tracking-tight">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 px-2 font-medium hover:bg-accent",
                                                        updatingUserId === user.id && "animate-pulse opacity-50"
                                                    )}
                                                >
                                                    {user.role === 'WINDOW_CLERK' || user.role === 'TRIAGE_NURSE' ? (
                                                        <span className="text-primary">
                                                            {user.workstation ? `${user.workstation.name} (#${user.workstation.stationNo})` : 'No Station'}
                                                        </span>
                                                    ) : (
                                                        user.department
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-64">
                                                {(user.role === 'WINDOW_CLERK' || user.role === 'TRIAGE_NURSE' || user.role === 'CLINIC_CALLER') && (
                                                    <>
                                                        <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-widest">Stations</div>
                                                        {workstations
                                                            .filter(ws => {
                                                                if (user.role === 'WINDOW_CLERK') return ws.type === WorkstationType.WINDOW;
                                                                if (user.role === 'TRIAGE_NURSE') return ws.type === WorkstationType.TRIAGE;
                                                                if (user.role === 'CLINIC_CALLER') return ws.type === WorkstationType.CALLER;
                                                                return false;
                                                            })
                                                            .map((ws) => (
                                                                <DropdownMenuItem
                                                                    key={ws.id}
                                                                    onClick={() => handleUpdateWorkstation(user.id, ws.id)}
                                                                >
                                                                    {ws.name} ({ws.stationNo})
                                                                </DropdownMenuItem>
                                                            ))}
                                                    </>
                                                )}

                                                {(user.role === 'CLINIC_CALLER' || user.role === 'ADMIN') && (
                                                    <>
                                                        <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-widest">Departments</div>
                                                        {departments.map((dept) => (
                                                            <DropdownMenuItem
                                                                key={dept.id}
                                                                onClick={() => handleUpdateDepartment(user.id, dept.name)}
                                                            >
                                                                {dept.name}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 hover:bg-accent"
                                                >
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-6">
                                                        {user.role.replace('_', ' ')}
                                                    </Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-48">
                                                {HOSPITAL_ROLES.map(({ value, label }) => (
                                                    <DropdownMenuItem
                                                        key={value}
                                                        onClick={() => handleUpdateRole(user.id, value)}
                                                    >
                                                        {label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        {user.isApproved ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 px-2">
                                                        <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px] font-bold uppercase tracking-wider h-6">
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
                                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-6 border-yellow-500 text-yellow-600">
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
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Check size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleReject(user.id)}
                                                    className="h-8 w-8 p-0 text-destructive"
                                                >
                                                    <Trash size={16} />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <span className="text-xs text-muted-foreground font-medium">
                                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} staff members
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 text-xs font-medium"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 text-xs font-medium"
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