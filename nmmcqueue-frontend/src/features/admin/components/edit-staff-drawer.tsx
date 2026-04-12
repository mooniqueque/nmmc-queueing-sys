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
            const promises = [];

            // 1. Update Profile Info if changed
            if (editName !== user.name || editEmail !== user.email) {
                promises.push(updateUserInfo(user.id, { name: editName, email: editEmail }));
            }

            // 2. Update Role if changed
            if (selectedRole !== user.role) {
                promises.push(updateUserRole(user.id, selectedRole));
            }

            // 3. Update Workstation if changed
            if (selectedWorkstationId !== (user.workstationId || "none")) {
                promises.push(updateUserWorkstation(user.id, selectedWorkstationId === "none" ? "" : selectedWorkstationId));
            }

            // 3. Update Departments
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
                promises.push(updateUserDepartmentAssignments(user.id, payload));
            }

            const results = await Promise.all(promises);
            const allSuccess = results.every(r => r.success);

            if (allSuccess) {
                notify.success("Staff profile updated successfully.");
                onSaved?.();
                onOpenChange(false);
            } else {
                notify.error("Some updates failed. Please try again.");
            }
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col p-0 gap-0 sm:max-w-xl bg-slate-50 shadow-2xl overflow-hidden border-l border-slate-200">
                <div className="flex-none bg-white px-6 pt-6 pb-6 border-b border-slate-100 shadow-sm">
                    <SheetHeader className="text-left p-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
                                <IdentificationCard size={30} weight="duotone" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-2xl font-bold text-slate-900 tracking-tight">User Management</SheetTitle>
                                <SheetDescription className="text-base text-slate-500 font-medium leading-6">
                                    Update staff details, roles, access, and reset passwords from one place.
                                </SheetDescription>
                            </div>
                        </div>

                        {user && (
                            <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-slate-900 truncate">{user.name}</p>
                                    <p className="text-sm text-slate-500 font-medium truncate">{user.email}</p>
                                </div>
                                <Badge variant="outline" className="ml-auto bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 border-slate-200 px-3 py-1">
                                    ID {user.employeeID}
                                </Badge>
                            </div>
                        )}
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-8">
                        {/* 0. Password Reset */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Reset Password</h3>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                                <p className="text-sm text-slate-500 leading-6">
                                    Set a temporary password for this staff account. They can log in with it right away.
                                </p>

                                {!showResetForm ? (
                                    <Button 
                                        variant="outline"
                                        onClick={() => setShowResetForm(true)}
                                        className="w-full h-12 rounded-xl border-dashed border-slate-300 text-slate-700 font-semibold text-base hover:bg-slate-50 hover:border-slate-400 gap-2 transition-all"
                                    >
                                        <Key size={18} weight="duotone" className="text-amber-500" />
                                        Reset Staff Password
                                    </Button>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-bold text-slate-600 ml-1 block">Temporary Password</label>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                                placeholder="Enter a temporary password"
                                                className="h-12 bg-white border-slate-200 rounded-lg text-base font-medium"
                                            />
                                            <Button 
                                                disabled={isResetting || !newPassword}
                                                onClick={handleResetPassword}
                                                className="h-12 px-4 rounded-lg bg-slate-900 text-white font-bold text-sm shrink-0"
                                            >
                                                {isResetting ? "Resetting..." : "Confirm"}
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowResetForm(false);
                                                    setNewPassword("");
                                                }}
                                                className="h-12 w-12 p-0 rounded-lg text-slate-400 hover:text-slate-600"
                                            >
                                                <CheckCircle size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 0. Profile Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Basic Profile</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <IdentificationCard size={14} className="text-slate-400" />
                                        Full Name
                                    </label>
                                    <Input 
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter staff name"
                                        className="h-12 bg-white border-slate-200 rounded-xl text-base font-medium shadow-sm transition-all focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <CheckCircle size={14} className="text-slate-400" />
                                        Email Address
                                    </label>
                                    <Input 
                                        value={editEmail}
                                        onChange={(e) => setEditEmail(e.target.value)}
                                        placeholder="staff@example.com"
                                        className="h-12 bg-white border-slate-200 rounded-xl text-base font-medium shadow-sm transition-all focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 1. General Settings */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">General Configuration</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Buildings size={14} className="text-slate-400" />
                                        System Role
                                    </label>
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl text-base font-medium shadow-sm focus:ring-emerald-500/20">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            {HOSPITAL_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value} className="text-base font-medium focus:bg-slate-50">
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Desktop size={14} className="text-slate-400" />
                                        {selectedRole === "WINDOW_CLERK" ? "Default Window" : "Assigned Station"}
                                    </label>
                                    <Select 
                                        value={selectedWorkstationId} 
                                        onValueChange={setSelectedWorkstationId}
                                        disabled={!["WINDOW_CLERK", "TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole)}
                                    >
                                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl text-base font-medium shadow-sm focus:ring-emerald-500/20">
                                            <SelectValue placeholder={selectedWorkstationId === "none" ? "No Station Assigned" : "Select Station"} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-200">
                                            <SelectItem value="none" className="text-base font-medium text-slate-400 italic">No Station</SelectItem>
                                            {filteredWorkstations.map((ws) => (
                                                <SelectItem key={ws.id} value={ws.id} className="text-base font-medium">
                                                    {ws.name} ({ws.stationNo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!["WINDOW_CLERK", "TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole) && (
                                        <p className="text-sm text-slate-500 mt-1 italic ml-1">* Stations are only applicable for clinical and window roles.</p>
                                    )}
                                    {selectedRole === "WINDOW_CLERK" && (
                                        <p className="text-sm text-slate-500 mt-1 italic ml-1">
                                            Window clerks are assigned to a default window only.
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                        <Buildings size={14} className="text-slate-400" />
                                        Department
                                    </label>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                                        <p className="text-base font-bold text-slate-900">{departmentSummary.label}</p>
                                        <p className="mt-1 text-sm text-slate-500 leading-6">{departmentSummary.helper}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Department Access */}
                        {["TRIAGE_NURSE", "CLINIC_CALLER"].includes(selectedRole) && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Department Access</h3>
                                    </div>
                                    <Badge variant="secondary" className="bg-white text-slate-500 font-bold border-slate-200 px-2 py-1 text-[10px]">
                                        {selectedRole === "TRIAGE_NURSE" ? "Multiple" : "Single Selection"}
                                    </Badge>
                                </div>

                                <div className="relative mb-3">
                                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter departments..."
                                        className="pl-10 h-12 bg-white border-slate-200 rounded-xl text-base placeholder:text-slate-400 shadow-sm transition-all focus:ring-emerald-500/10"
                                    />
                                </div>

                                <div className="space-y-2 max-h-100 overflow-y-auto pr-2 custom-scrollbar pb-2">
                                    {isLoading ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                                            <div className="h-5 w-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                            <span className="text-sm font-bold uppercase tracking-wider">Syncing Departments...</span>
                                        </div>
                                    ) : filteredDepartments.length === 0 ? (
                                        <div className="py-10 text-center text-slate-400 text-sm italic bg-white rounded-xl border border-dashed border-slate-200">
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
                                                            "group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                                            entry.isAssigned 
                                                                ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                                                : "bg-white border-slate-200 hover:border-slate-300 shadow-none"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Checkbox 
                                                                checked={entry.isAssigned} 
                                                                onCheckedChange={(val) => toggleDepartment(entry.departmentId, !!val)}
                                                                className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-sm font-bold uppercase tracking-tight truncate", entry.isAssigned ? "text-emerald-900" : "text-slate-700")}>
                                                                    {entry.department.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
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
                                                            "group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                                            callerSelectedDeptId === entry.departmentId 
                                                                ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                                                : "bg-white border-slate-200 hover:border-slate-300 shadow-none"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <RadioGroupItem 
                                                                value={entry.departmentId} 
                                                                className="border-slate-300 text-emerald-600"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-sm font-bold uppercase tracking-tight truncate", callerSelectedDeptId === entry.departmentId ? "text-emerald-900" : "text-slate-700")}>
                                                                    {entry.department.name}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
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

                <div className="flex-none bg-white border-t border-slate-100 p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <div className="flex gap-3 max-w-sm mx-auto sm:max-w-none">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-12 rounded-xl font-bold text-base text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all border border-transparent active:scale-[0.98]"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Dismiss
                        </Button>
                        <Button 
                            className="flex-2 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-lg shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
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
