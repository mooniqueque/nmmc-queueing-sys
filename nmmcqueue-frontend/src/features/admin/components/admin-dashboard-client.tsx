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
    Desktop,
    FirstAidKit,
    Funnel,
    MagnifyingGlass,
    Phone,
    User,
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

    const getRoleBadgeClass = (role: UserData['role']) => {
        switch (role) {
            case 'WINDOW_CLERK':
                return 'border-sky-200 bg-sky-50 text-sky-700';
            case 'TRIAGE_NURSE':
                return 'border-violet-200 bg-violet-50 text-violet-700';
            case 'CLINIC_CALLER':
                return 'border-emerald-200 bg-emerald-50 text-emerald-700';
            case 'ADMIN':
                return 'border-amber-200 bg-amber-50 text-amber-700';
            default:
                return 'border-muted bg-muted text-muted-foreground';
        }
    };

    const getRoleIcon = (role: UserData['role']) => {
        switch (role) {
            case 'WINDOW_CLERK':
                return <Desktop size={12} weight="bold" aria-hidden="true" />;
            case 'TRIAGE_NURSE':
                return <FirstAidKit size={12} weight="bold" aria-hidden="true" />;
            case 'CLINIC_CALLER':
                return <Phone size={12} weight="bold" aria-hidden="true" />;
            case 'ADMIN':
                return <User size={12} weight="bold" aria-hidden="true" />;
            default:
                return null;
        }
    };

    const getStationTextClass = (role: UserData['role']) => {
        switch (role) {
            case 'WINDOW_CLERK':
                return 'text-sky-700';
            case 'TRIAGE_NURSE':
                return 'text-violet-700';
            case 'CLINIC_CALLER':
                return 'text-emerald-700';
            default:
                return 'text-muted-foreground';
        }
    };

    const getDepartmentBadgeClass = (departmentName: string) => {
        const normalized = departmentName.toLowerCase();

        if (normalized.includes('window')) {
            return 'border-sky-200 bg-sky-50 text-sky-700';
        }

        if (normalized.includes('triage')) {
            return 'border-violet-200 bg-violet-50 text-violet-700';
        }

        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
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
    }).sort((a, b) => a.name.localeCompare(b.name));
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

            <main className="flex-1 p-6 lg:p-8 space-y-7 max-w-400 mx-auto w-full">

                {/* ANALYTICS */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
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
                <div className="sticky top-14 z-30 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-lg border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85 p-3">
                    <div className="relative w-full sm:max-w-md">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                            placeholder="Search staff, email, station, or department..."
                            className="pl-9 h-10 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-2 h-10 px-4 text-sm font-medium">
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

                        <AddUserDialog departments={departments} users={users} />
                    </div>
                </div>

                <div className="rounded-lg border bg-card px-4 py-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-semibold text-muted-foreground">Role Legend</span>
                        <Badge variant="outline" className="inline-flex items-center gap-1.5 border-sky-200 bg-sky-50 text-sky-700">
                            <Desktop size={12} weight="bold" aria-hidden="true" />
                            <span>1. Window Clerk</span>
                        </Badge>
                        <Badge variant="outline" className="inline-flex items-center gap-1.5 border-violet-200 bg-violet-50 text-violet-700">
                            <FirstAidKit size={12} weight="bold" aria-hidden="true" />
                            <span>2. Triage Nurse</span>
                        </Badge>
                        <Badge variant="outline" className="inline-flex items-center gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                            <Phone size={12} weight="bold" aria-hidden="true" />
                            <span>3. Clinic Caller</span>
                        </Badge>
                        <Badge variant="outline" className="inline-flex items-center gap-1.5 border-amber-200 bg-amber-50 text-amber-700">
                            <User size={12} weight="bold" aria-hidden="true" />
                            <span>4. Admin</span>
                        </Badge>
                    </div>
                </div>

                {/* User Table */}
                <Card className="rounded-lg border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-80 py-4 text-left text-xs font-medium text-muted-foreground">Staff Info</TableHead>
                                <TableHead className="py-4 text-left text-xs font-medium text-muted-foreground">Role</TableHead>
                                <TableHead className="py-4 text-left text-xs font-medium text-muted-foreground">Station</TableHead>
                                <TableHead className="py-4 text-left text-xs font-medium text-muted-foreground">Departments</TableHead>
                                <TableHead className="py-4 text-left text-xs font-medium text-muted-foreground w-32">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.map((user) => (
                                <TableRow 
                                    key={user.id} 
                                    className="h-16 cursor-pointer hover:bg-muted/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
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
                                            <span className="font-medium text-foreground tracking-tight text-sm">{user.name}</span>
                                            <span className="text-xs font-medium text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col py-0.5">
                                            <Badge variant="outline" className={cn("w-fit text-xs font-medium h-6 mb-1", getRoleBadgeClass(user.role))}>
                                                {getRoleIcon(user.role)}
                                                {user.role.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col py-0.5">
                                            <span className={cn("text-xs font-medium flex items-center gap-1.5 min-h-4", getStationTextClass(user.role))}>
                                                {user.role === 'WINDOW_CLERK' || user.role === 'TRIAGE_NURSE' || user.role === 'CLINIC_CALLER' ? (
                                                    user.workstation ? (
                                                        <>
                                                            <div className="h-1 w-1 rounded-full bg-current/60" />
                                                            {user.workstation.name} (#{user.workstation.stationNo})
                                                        </>
                                                    ) : (
                                                        <span className="text-amber-500 italic font-medium opacity-80">No station assigned</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-300 font-medium italic">N/A</span>
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
                                                            className={cn("h-6 px-2 text-xs font-medium border", getDepartmentBadgeClass(department.name))}
                                                        >
                                                            {department.name}
                                                        </Badge>
                                                    ))}
                                                    {hiddenCount > 0 && (
                                                        <Badge
                                                            variant="secondary"
                                                            title={departmentList.slice(2).map((department) => department.name).join(', ')}
                                                            className="h-6 px-2 text-xs font-medium"
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
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all duration-200 active:scale-95 disabled:opacity-50",
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
                            <span className="text-sm text-muted-foreground font-medium">
                                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} staff members
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="h-9 px-4 text-sm font-medium"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-9 px-4 text-sm font-medium"
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
                    users={users}
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