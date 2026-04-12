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
import { useIsMounted } from "@/shared/hooks/use-is-mounted";
import { AdminHeader } from "@/shared/layouts";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { SessionUser, UserData } from "@/shared/types/auth";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import {
    CheckCircle,
    Funnel,
    MagnifyingGlass,
    Users,
    WarningCircle,
    XCircle
} from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { toggleUserStatus } from "../user-actions";
import { AddUserDialog } from "./add-user-dialog";
import { AddWorkstationDialog } from "./add-workstation-dialog";
import { EditStaffDrawer } from "./edit-staff-drawer";
import { StatsCard } from "./stats-card";

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
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [selectedEditUser, setSelectedEditUser] = useState<UserData | null>(null);
    const [addWorkstationDialogOpen, setAddWorkstationDialogOpen] = useState(false);
    const [selectedWorkstationType] = useState<WorkstationType | null>(null);
    const [localWorkstations, setLocalWorkstations] = useState<WorkStation[]>(workstations);
    const isMounted = useIsMounted();
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const roleSortOrder: Record<string, number> = {
        WINDOW_CLERK: 1,
        TRIAGE_NURSE: 2,
        CLINIC_CALLER: 3,
        ADMIN: 4,
    };

    const getDisplayDepartments = (user: UserData) => {
        if (user.role === 'WINDOW_CLERK') {
            return [{ id: `default-window-${user.id}`, name: 'Windows', code: 'WND' }];
        }

        if (user.role === 'TRIAGE_NURSE') {
            return [{ id: `default-triage-${user.id}`, name: 'Triage', code: 'TRI' }];
        }

        const assignments = (user.departmentAccess || [])
            .filter((entry) => entry.isEnabled)
            .map((entry) => entry.department);

        if (assignments.length > 0) return assignments;

        if (user.departmentId && user.department) {
            return [{ id: user.departmentId, name: user.department, code: user.department.slice(0, 3).toUpperCase() }];
        }

        return [];
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterRole]);


    // 2. DATA CALCULATIONS (Derived State)
    const analytics = {
        total: initialUsers.length,
        active: initialUsers.filter(u => u.isActive).length,
        inactive: initialUsers.filter(u => !u.isActive).length
    };

    // 3. FILTERING (Let React Compiler handle memoization)
    const users = initialUsers || [];
    const filteredUsers = users.filter(user => {
        const departmentNames = getDisplayDepartments(user).map((entry) => entry.name.toLowerCase());

        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.department?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            departmentNames.some((name) => name.includes(searchQuery.toLowerCase())) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.workstation?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            user.employeeID.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterRole === 'All Users' || user.role === filterRole;
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        const roleRankA = roleSortOrder[a.role] ?? 99;
        const roleRankB = roleSortOrder[b.role] ?? 99;

        if (roleRankA !== roleRankB) {
            return roleRankA - roleRankB;
        }

        return a.name.localeCompare(b.name);
    });
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);


    // 4. ACTION HANDLERS
    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setUpdatingUserId(userId);
        try {
            const result = await toggleUserStatus(userId, !currentStatus);
            if (result.success) {
                router.refresh();
            } else {
                notify.error(result.error || "Failed to update user status.");
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleEditStaff = (user: UserData) => {
        setSelectedEditUser(user);
        setEditDrawerOpen(true);
    };

    const handleWorkstationCreated = (newWorkstation: WorkStation) => {
        setLocalWorkstations((current) => [...current, newWorkstation]);
    };

    if (!loggedInUser || !isMounted) return null;

    return (
        <div className="flex flex-1 flex-col">
            {/* Header Section */}
            <AdminHeader 
                user={loggedInUser} 
                title="Admin Dashboard" 
            />

            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-400 mx-auto w-full">

                {/* ANALYTICS */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                    <StatsCard
                        label="Total System User"
                        value={analytics.total.toString().padStart(2, '0')}
                        icon={<Users size={28} className="text-white" />}
                        color="bg-emerald-600"
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
                            placeholder="Search staff, email, station, or department..."
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

                        <AddUserDialog departments={departments} />
                    </div>
                </div>

                {/* User Table */}
                <Card className="rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-80 font-bold py-5 text-left text-[11px] uppercase tracking-wider text-slate-500">Staff Info</TableHead>
                                <TableHead className="font-bold py-5 text-left text-[11px] uppercase tracking-wider text-slate-500">Role & Station</TableHead>
                                <TableHead className="font-bold py-5 text-left text-[11px] uppercase tracking-wider text-slate-500">Departments</TableHead>
                                <TableHead className="font-bold py-5 text-left text-[11px] uppercase tracking-wider text-slate-500 w-32">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map((user) => (
                                <TableRow 
                                    key={user.id} 
                                    className="h-16 cursor-pointer hover:bg-slate-50/80 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-inset"
                                    onClick={() => handleEditStaff(user)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleEditStaff(user);
                                        }
                                    }}
                                    tabIndex={0}
                                >
                                    <TableCell>
                                        <div className="flex flex-col py-0.5">
                                            <span className="font-bold text-slate-800 tracking-tight text-[13px]">{user.name}</span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col py-0.5">
                                            <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase tracking-[0.15em] h-5 text-indigo-600 border-indigo-100 bg-indigo-50/50 mb-1">
                                                {user.role.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 min-h-4">
                                                {user.role === 'WINDOW_CLERK' || user.role === 'TRIAGE_NURSE' || user.role === 'CLINIC_CALLER' ? (
                                                    user.workstation ? (
                                                        <>
                                                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                                                            {user.workstation.name} (#{user.workstation.stationNo})
                                                        </>
                                                    ) : (
                                                        <span className="text-amber-500 italic font-medium opacity-80">No station assigned</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-300 font-medium italic">Administrative Role</span>
                                                )}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const departmentList = getDisplayDepartments(user);
                                            if (departmentList.length === 0) {
                                                return (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-tighter">
                                                        <WarningCircle size={12} weight="fill" />
                                                        <span>Unassigned</span>
                                                    </div>
                                                );
                                            }

                                            const visible = departmentList.slice(0, 2);
                                            const hiddenCount = departmentList.length - visible.length;

                                            return (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {visible.map((department) => (
                                                        <Badge
                                                            key={department.id}
                                                            variant="secondary"
                                                            className="h-5 px-2 bg-slate-100/80 text-slate-600 border-slate-200 text-[9px] font-bold uppercase tracking-wider"
                                                        >
                                                            {department.name}
                                                        </Badge>
                                                    ))}
                                                    {hiddenCount > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            title={departmentList.slice(2).map((department) => department.name).join(', ')}
                                                            className="h-5 px-2 bg-white text-slate-400 border-slate-200 text-[9px] font-bold"
                                                        >
                                                            +{hiddenCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStatus(user.id, user.isActive);
                                            }}
                                            disabled={updatingUserId === user.id}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border transition-all duration-200 active:scale-95 disabled:opacity-50",
                                                user.isActive
                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
                                                    : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                                            )}
                                        >
                                            <div className={cn("h-1.5 w-1.5 rounded-full", user.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                            {user.isActive ? "Active" : "Inactive"}
                                        </button>
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

                <EditStaffDrawer
                    open={editDrawerOpen}
                    onOpenChange={setEditDrawerOpen}
                    user={selectedEditUser}
                    workstations={localWorkstations}
                    onSaved={() => router.refresh()}
                />

                {selectedWorkstationType && (
                    <AddWorkstationDialog
                        open={addWorkstationDialogOpen}
                        onOpenChange={setAddWorkstationDialogOpen}
                        workstations={localWorkstations}
                        departments={departments}
                        type={selectedWorkstationType}
                        onWorkstationCreated={handleWorkstationCreated}
                    />
                )}
            </main>
        </div>
    );
}