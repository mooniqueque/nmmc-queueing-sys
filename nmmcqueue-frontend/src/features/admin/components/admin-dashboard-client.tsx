"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import { HOSPITAL_ROLES } from "@/shared/types/constants";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import {
    CheckCircle,
    Funnel,
    MagnifyingGlass,
    Plus,
    Users,
    XCircle
} from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { toggleUserStatus, updateUserDepartment, updateUserRole, updateUserWorkstation } from "../user-actions";
import { AddUserDialog } from "./add-user-dialog";
import { AddWorkstationDialog } from "./add-workstation-dialog";
import { ManageClinicCallerDepartmentsDrawer } from "./manage-clinic-caller-departments-drawer";
import { ManageTriageDepartmentsDrawer } from "./manage-triage-departments-drawer";
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
    const [departmentDrawerOpen, setDepartmentDrawerOpen] = useState(false);
    const [selectedDepartmentUser, setSelectedDepartmentUser] = useState<UserData | null>(null);
    const [clinicCallerDrawerOpen, setClinicCallerDrawerOpen] = useState(false);
    const [selectedClinicCallerUser, setSelectedClinicCallerUser] = useState<UserData | null>(null);
    const [addWorkstationDialogOpen, setAddWorkstationDialogOpen] = useState(false);
    const [selectedWorkstationType, setSelectedWorkstationType] = useState<WorkstationType | null>(null);
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
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.department?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
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
    const handleUpdateRole = async (userId: string, newRole: string) => {
        setUpdatingUserId(userId);
        try {
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
                router.refresh();
            } else {
                notify.error(result.error || "Failed to update user role.");
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
                notify.error(result.error || "Failed to update user department.");
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
                notify.error(result.error || "Failed to update workstation assignment.");
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
                notify.error(result.error || "Failed to update user status.");
            }
        } finally {
            setUpdatingUserId(null);
        }
    };

    const handleManageDepartments = (user: UserData) => {
        setSelectedDepartmentUser(user);
        setDepartmentDrawerOpen(true);
    };

    const handleManageClinicCallerDepartments = (user: UserData) => {
        setSelectedClinicCallerUser(user);
        setClinicCallerDrawerOpen(true);
    };

    const handleOpenAddWorkstationDialog = (stationType: WorkstationType) => {
        setSelectedWorkstationType(stationType);
        setAddWorkstationDialogOpen(true);
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

            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">

                {/* ANALYTICS */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
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

                        <AddUserDialog departments={departments} />
                    </div>
                </div>

                {/* User Table */}
                <Card className="rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-75 font-semibold">Staff Info</TableHead>
                                <TableHead className="font-semibold">Assignment</TableHead>
                                <TableHead className="font-semibold">Department Access</TableHead>
                                <TableHead className="font-semibold">System Role</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
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
                                                    {user.role === 'WINDOW_CLERK' || user.role === 'TRIAGE_NURSE' || user.role === 'CLINIC_CALLER' ? (
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
                                                        {localWorkstations
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
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenAddWorkstationDialog(user.role === 'WINDOW_CLERK' ? WorkstationType.WINDOW : user.role === 'TRIAGE_NURSE' ? WorkstationType.TRIAGE : WorkstationType.CALLER)}
                                                            className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                                        >
                                                            <Plus size={14} className="mr-2" />
                                                            <span className="text-xs font-semibold">Add Station</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell>
                                        {user.role === 'TRIAGE_NURSE' ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 px-2.5 border-dashed text-xs font-semibold tracking-tight whitespace-nowrap"
                                                onClick={() => handleManageDepartments(user)}
                                                title="Manage triage department access"
                                            >
                                                <span>Manage</span>
                                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                                    Triage
                                                </Badge>
                                            </Button>
                                        ) : user.role === 'CLINIC_CALLER' ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 px-2.5 border-dashed text-xs font-semibold tracking-tight whitespace-nowrap"
                                                onClick={() => handleManageClinicCallerDepartments(user)}
                                                title="Manage clinic caller department access"
                                            >
                                                <span>Manage</span>
                                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                                    Caller
                                                </Badge>
                                            </Button>
                                        ) : (
                                            <span className="text-xs font-medium text-muted-foreground">Not Applicable</span>
                                        )}
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

                <ManageTriageDepartmentsDrawer
                    open={departmentDrawerOpen}
                    onOpenChange={setDepartmentDrawerOpen}
                    user={selectedDepartmentUser}
                    onSaved={() => router.refresh()}
                />

                <ManageClinicCallerDepartmentsDrawer
                    open={clinicCallerDrawerOpen}
                    onOpenChange={setClinicCallerDrawerOpen}
                    user={selectedClinicCallerUser}
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