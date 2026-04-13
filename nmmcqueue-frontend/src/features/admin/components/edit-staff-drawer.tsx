"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { getDepartments } from "@/features/shared/api";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { UserData } from "@/shared/types/auth";
import { HOSPITAL_ROLES } from "@/shared/types/constants";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import {
    Buildings,
    CheckCircle,
    Desktop,
    Eye,
    EyeSlash,
    IdentificationCard,
    Key,
    MagnifyingGlass
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    adminResetPassword,
    getUserDepartmentAssignments,
    updateUserDepartmentAssignments,
    updateUserInfo,
    updateUserRole,
    updateUserWorkstation
} from "../user-actions";

interface EditStaffDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserData | null;
    workstations: WorkStation[];
    users: UserData[];
    onSaved?: () => void;
}

type DepartmentAccessState = {
    departmentId: string;
    department: Department;
    isAssigned: boolean;
};

type DepartmentAssignment = {
    departmentId: string;
    isEnabled: boolean;
};

type DepartmentAssignmentsResponse = {
    assignments?: DepartmentAssignment[];
};

function getDepartmentSummary(role: string, departmentState: DepartmentAccessState[]) {
    if (role === "WINDOW_CLERK") {
        return {
            label: "Windows",
            helper: "Window clerks use Windows as their default department.",
        };
    }

    if (role === "TRIAGE_NURSE") {
        return {
            label: "Triage",
            helper: "Triage nurses use Triage as their default department.",
        };
    }

    if (role === "CLINIC_CALLER") {
        const assignedDepartments = departmentState
            .filter((entry) => entry.isAssigned)
            .map((entry) => entry.department.name);

        return {
            label: assignedDepartments.length > 0
                ? assignedDepartments.slice(0, 2).join(", ") + (assignedDepartments.length > 2 ? ` +${assignedDepartments.length - 2}` : "")
                : "Clinic Departments",
            helper: "Clinic callers keep their clinic department access below.",
        };
    }

    return {
        label: "Not assigned",
        helper: "No department is required for this role.",
    };
}

export function EditStaffDrawer({
    open,
    onOpenChange,
    user,
    workstations,
    users,
    onSaved,
}: EditStaffDrawerProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form State
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>("none");
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentState, setDepartmentState] = useState<DepartmentAccessState[]>([]);
    const [callerSelectedDeptId, setCallerSelectedDeptId] = useState<string>("none");

    // Password Reset State
    const [showResetForm, setShowResetForm] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const resetState = useCallback(() => {
        setEditName("");
        setEditEmail("");
        setSearchQuery("");
        setDepartmentState([]);
        setSelectedRole("");
        setSelectedWorkstationId("none");
        setCallerSelectedDeptId("none");
        setShowResetForm(false);
        setNewPassword("");
        setShowPassword(false);
    }, []);

    const initializeDrawer = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        setEditName(user.name);
        setEditEmail(user.email);
        setSelectedRole(user.role);
        setSelectedWorkstationId(user.workstationId || "none");

        try {
            const [depsRes, assignRes] = await Promise.all([
                getDepartments(),
                getUserDepartmentAssignments(user.id),
            ]);

            const departments = Array.isArray(depsRes?.data) ? (depsRes.data as Department[]) : [];
            const assignments = ((assignRes?.data as DepartmentAssignmentsResponse | undefined)?.assignments ?? []);

            const state = departments.map((d) => ({
                departmentId: d.id,
                department: d,
                isAssigned: assignments.some((a) => a.departmentId === d.id && a.isEnabled),
            }));

            setDepartmentState(state);
            
            if (user.role === "CLINIC_CALLER") {
                const assigned = assignments.find((a) => a.isEnabled);
                setCallerSelectedDeptId(assigned?.departmentId || "none");
            }
        } catch {
            notify.error("Failed to load staff details.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!open || !user?.id) {
            if (!open) resetState();
            return;
        }

        void initializeDrawer();
    }, [open, user?.id, initializeDrawer, resetState]);

    const filteredDepartments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return departmentState;
        return departmentState.filter(
            (s) => s.department.name.toLowerCase().includes(query) || s.department.code.toLowerCase().includes(query)
        );
    }, [departmentState, searchQuery]);

    const departmentSummary = useMemo(
        () => getDepartmentSummary(selectedRole, departmentState),
        [departmentState, selectedRole]
    );

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const getErrorMessage = (result: unknown, fallback: string) => {
                if (!result || typeof result !== "object") return fallback;
                const payload = result as { error?: string; message?: string };
                return payload.error || payload.message || fallback;
            };

            // 1. Update Profile Info if changed
            if (editName !== user.name || editEmail !== user.email) {
                const infoResult = await updateUserInfo(user.id, { name: editName, email: editEmail });
                if (!infoResult?.success) {
                    notify.error(getErrorMessage(infoResult, "Failed to update profile info."));
                    return;
                }
            }

            // 2. Update Role if changed
            if (selectedRole !== user.role) {
                const roleResult = await updateUserRole(user.id, selectedRole);
                if (!roleResult?.success) {
                    notify.error(getErrorMessage(roleResult, "Failed to update role."));
                    return;
                }
            }

            // 3. Update Workstation if changed
            if (selectedWorkstationId !== (user.workstationId || "none")) {
                const workstationResult = await updateUserWorkstation(
                    user.id,
                    selectedWorkstationId === "none" ? null : selectedWorkstationId
                );

                if (!workstationResult?.success) {
                    notify.error(getErrorMessage(workstationResult, "Failed to update station."));
                    return;
                }
            }

            // 4. Update Departments
            let payload: DepartmentAssignment[] = [];
            let shouldUpdateDepartmentAssignments = false;
            if (selectedRole === "TRIAGE_NURSE") {
                payload = departmentState.filter(d => d.isAssigned).map(d => ({ departmentId: d.departmentId, isEnabled: true }));
                shouldUpdateDepartmentAssignments = true;
            } else if (selectedRole === "CLINIC_CALLER") {
                if (callerSelectedDeptId !== "none") {
                    payload = [{ departmentId: callerSelectedDeptId, isEnabled: true }];
                }
                shouldUpdateDepartmentAssignments = true;
            }

            if (shouldUpdateDepartmentAssignments) {
                const departmentResult = await updateUserDepartmentAssignments(user.id, payload);
                if (!departmentResult?.success) {
                    notify.error(getErrorMessage(departmentResult, "Failed to update department access."));
                    return;
                }
            }

            notify.success("Staff profile updated successfully.");
            onSaved?.();
            onOpenChange(false);
        } catch {
            notify.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!user || !newPassword) return;
        setIsResetting(true);
        try {
            const result = await adminResetPassword(user.id, { password: newPassword });
            if (result.success) {
                notify.success("Password successfully reset.");
                setShowResetForm(false);
                setNewPassword("");
                setShowPassword(false);
            } else {
                notify.error(result.error || "Failed to reset password.");
            }
        } catch {
            notify.error("An error occurred during password reset.");
        } finally {
            setIsResetting(false);
        }
    };

    const toggleDepartment = (id: string, val: boolean) => {
        setDepartmentState(prev => prev.map(d => d.departmentId === id ? { ...d, isAssigned: val } : d));
    };

    const filteredWorkstations = workstations.filter(ws => {
        if (selectedRole === "WINDOW_CLERK") return ws.type === WorkstationType.WINDOW;
        if (selectedRole === "TRIAGE_NURSE") return ws.type === WorkstationType.TRIAGE;
        if (selectedRole === "CLINIC_CALLER") return ws.type === WorkstationType.CALLER;
        return false;
    });

    const occupiedStationIds = useMemo(() => {
        const currentUserId = user?.id;
        return new Set(
            users
                .filter(
                    (entry) =>
                        entry.id !== currentUserId &&
                        entry.isActive &&
                        Boolean(entry.workstationId) &&
                        (entry.role === "WINDOW_CLERK" || entry.role === "TRIAGE_NURSE" || entry.role === "CLINIC_CALLER")
                )
                .map((entry) => entry.workstationId as string)
        );
    }, [user?.id, users]);

    const availableWorkstations = filteredWorkstations.filter((ws) => !occupiedStationIds.has(ws.id));

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col p-0 gap-0 sm:max-w-2xl lg:max-w-4xl bg-background overflow-hidden border-l">
                <div className="flex-none bg-background px-6 pt-6 pb-5 border-b">
                    <SheetHeader className="text-left p-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <IdentificationCard size={30} weight="duotone" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-2xl font-semibold tracking-tight">User Management</SheetTitle>
                                <SheetDescription className="text-sm text-muted-foreground leading-6">
                                    Update staff details, roles, access, and reset passwords from one place.
                                </SheetDescription>
                            </div>
                        </div>

                        {user && (
                            <div className="mt-5 flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-base">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold truncate">{user.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <Badge variant="outline" className="ml-auto text-xs font-medium">
                                    ID {user.employeeID}
                                </Badge>
                            </div>
                        )}
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">
                        {/* 0. Password Reset */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground">Reset Password</h3>
                            </div>

                            <div className="rounded-lg border bg-card p-4 space-y-3">
                                <p className="text-sm text-muted-foreground leading-6">
                                    Set a temporary password for this staff account. They can log in with it right away.
                                </p>

                                {!showResetForm ? (
                                    <Button 
                                        variant="outline"
                                        onClick={() => setShowResetForm(true)}
                                        className="w-full h-10 border-dashed gap-2"
                                    >
                                        <Key size={18} weight="duotone" className="text-amber-500" />
                                        Reset Staff Password
                                    </Button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-medium text-muted-foreground block">Temporary Password</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input 
                                                    type={showPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    placeholder="Enter a temporary password"
                                                    className="h-10 pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPassword((current) => !current)}
                                                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0 text-muted-foreground hover:bg-muted"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                                </Button>
                                            </div>
                                            <Button 
                                                disabled={isResetting || !newPassword}
                                                onClick={handleResetPassword}
                                                className="h-10 px-4 shrink-0"
                                            >
                                                {isResetting ? "Resetting..." : "Confirm"}
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowResetForm(false);
                                                    setNewPassword("");
                                                }}
                                                className="h-10 w-10 p-0"
                                            >
                                                <CheckCircle size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 0. Profile Information */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground">Basic Profile</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-lg border bg-card p-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <IdentificationCard size={14} className="text-muted-foreground" />
                                        Full Name
                                    </label>
                                    <Input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter staff name"
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <CheckCircle size={14} className="text-muted-foreground" />
                                        Email Address
                                    </label>
                                    <Input 
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="staff@example.com"
                                        className="h-10"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 1. General Settings */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground">General Configuration</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-lg border bg-card p-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Buildings size={14} className="text-muted-foreground" />
                                        System Role
                                    </label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {HOSPITAL_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Desktop size={14} className="text-muted-foreground" />
                                        {selectedRole === "WINDOW_CLERK" ? "Default Window" : "Assigned Station"}
                                    </label>
                                    <Select 
                                        value={selectedWorkstationId} 
                                        onValueChange={setSelectedWorkstationId}
                                        disabled={!["WINDOW_CLERK", "TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole)}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder={selectedWorkstationId === "none" ? "No Station Assigned" : "Select Station"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" className="text-muted-foreground italic">No Station</SelectItem>
                                            {availableWorkstations.length === 0 ? (
                                                <div className="px-3 py-2 text-xs font-medium text-amber-700">
                                                    All stations are occupied. Add more station.
                                                </div>
                                            ) : (
                                                availableWorkstations.map((ws) => (
                                                    <SelectItem key={ws.id} value={ws.id}>
                                                        {ws.name} ({ws.stationNo})
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {!["WINDOW_CLERK", "TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole) && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">Stations are only applicable for clinical and window roles.</p>
                                    )}
                                    {["WINDOW_CLERK", "TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole) && availableWorkstations.length === 0 && (
                                        <p className="text-xs text-amber-700 mt-1">All stations are occupied. Add more station.</p>
                                    )}
                                    {selectedRole === "WINDOW_CLERK" && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                            Window clerks are assigned to a default window only.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                        <Buildings size={14} className="text-muted-foreground" />
                                        Department
                                    </label>
                                    <div className="rounded-lg border bg-muted/40 px-4 py-3">
                                        <p className="text-sm font-semibold">{departmentSummary.label}</p>
                                        <p className="mt-1 text-xs text-muted-foreground leading-6">{departmentSummary.helper}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Department Access */}
                        {["TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole) && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <h3 className="text-sm font-semibold text-muted-foreground">Department Access</h3>
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {selectedRole === "TRIAGE_NURSE" ? "Multiple" : "Single Selection"}
                                    </Badge>
                                </div>

                                <div className="relative mb-3">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter departments..."
                                        className="pl-10 h-10"
                                    />
                                </div>

                                <div className="space-y-2 max-h-112 overflow-y-auto pr-2 custom-scrollbar pb-2">
                                    {isLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                            <div className="h-5 w-5 border-2 border-muted border-t-foreground rounded-full animate-spin" />
                                            <span className="text-sm font-medium">Syncing Departments...</span>
                                        </div>
                                    ) : filteredDepartments.length === 0 ? (
                                        <div className="py-10 text-center text-muted-foreground text-sm italic bg-card rounded-lg border border-dashed">
                                            No matching departments found.
                                        </div>
                                    ) : (
                                        selectedRole === "TRIAGE_NURSE" ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {filteredDepartments.map((entry) => (
                                                    <div 
                                                        key={entry.departmentId}
                                                        onClick={() => toggleDepartment(entry.departmentId, !entry.isAssigned)}
                                                        className={cn(
                                                            "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                                            entry.isAssigned 
                                                                ? "bg-emerald-50 border-emerald-200" 
                                                                : "bg-card hover:bg-muted/40"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Checkbox 
                                                                checked={entry.isAssigned} 
                                                                onCheckedChange={(val) => toggleDepartment(entry.departmentId, !!val)}
                                                                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-sm font-medium truncate", entry.isAssigned ? "text-emerald-900" : "text-foreground")}>
                                                                    {entry.department.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                                                                    CODE: {entry.department.code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {entry.isAssigned && <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <RadioGroup value={callerSelectedDeptId} onValueChange={setCallerSelectedDeptId} className="grid grid-cols-1 gap-2">
                                                {filteredDepartments.map((entry) => (
                                                    <div 
                                                        key={entry.departmentId}
                                                        onClick={() => setCallerSelectedDeptId(entry.departmentId)}
                                                        className={cn(
                                                            "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                                            callerSelectedDeptId === entry.departmentId 
                                                                ? "bg-emerald-50 border-emerald-200" 
                                                                : "bg-card hover:bg-muted/40"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <RadioGroupItem 
                                                                value={entry.departmentId} 
                                                                className="border-slate-300 text-emerald-600"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-sm font-medium truncate", callerSelectedDeptId === entry.departmentId ? "text-emerald-900" : "text-foreground")}>
                                                                    {entry.department.name}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                                                                    CODE: {entry.department.code}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {callerSelectedDeptId === entry.departmentId && <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />}
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )
                                    )}
                                </div>
                            </section>
                        )}

                    </div>
                </div>

                <div className="flex-none bg-background border-t p-4">
                    <div className="flex gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-10 text-sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Dismiss
                        </Button>
                        <Button 
                            className="flex-2 h-10 text-sm"
                            onClick={handleSave}
                            disabled={isSaving || isLoading || !user}
                        >
                            {isSaving ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </div>
                            ) : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </Sheet>
    );
}
