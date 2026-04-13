"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getDepartments } from "@/features/shared/api";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { UserData } from "@/shared/types/auth";
import { Department } from "@/shared/types/models";
import { MagnifyingGlass, Users } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { getUserDepartmentAssignments, updateUserDepartmentAssignments } from "../user-actions";

type DepartmentAccessState = {
    departmentId: string;
    department: Department;
    isAssigned: boolean;
};

type DepartmentAccessResponse = {
    user: Pick<UserData, "id" | "name" | "email" | "role" | "department" | "departmentId">;
    departments: Department[];
    assignments: Array<{
        departmentId: string;
        isEnabled: boolean;
        department: Department;
    }>;
};

function buildDepartmentState(
    departments: Department[],
    assignments: DepartmentAccessResponse["assignments"]
): DepartmentAccessState[] {
    const assignmentMap = new Map(
        assignments.map((assignment) => [assignment.departmentId, assignment])
    );

    return departments.map((department) => {
        const assigned = assignmentMap.get(department.id);

        return {
            departmentId: department.id,
            department,
            isAssigned: Boolean(assigned),
        };
    });
}

interface ManageTriageDepartmentsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserData | null;
    onSaved?: () => void;
}

export function ManageTriageDepartmentsDrawer({
    open,
    onOpenChange,
    user,
    onSaved,
}: ManageTriageDepartmentsDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentState, setDepartmentState] = useState<DepartmentAccessState[]>([]);

    useEffect(() => {
        if (!open || !user?.id) {
            if (!open) {
                setSearchQuery("");
                setDepartmentState([]);
            }
            return;
        }

        let active = true;
        setIsLoading(true);
        setSearchQuery("");

        Promise.all([
            getDepartments(),
            getUserDepartmentAssignments(user.id),
        ])
            .then(([departmentsResponse, assignmentsResponse]) => {
                if (!active) return;

                const departments = Array.isArray(departmentsResponse?.data)
                    ? (departmentsResponse.data as Department[])
                    : [];

                const responseData = assignmentsResponse?.data as DepartmentAccessResponse | undefined;
                const assignments = responseData?.assignments ?? [];

                setDepartmentState(buildDepartmentState(departments, assignments));
            })
            .catch(() => {
                if (active) {
                    notify.error("Unable to load department access.");
                }
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [open, user?.id]);

    const filteredDepartments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return departmentState;

        return departmentState.filter((entry) => {
            return (
                entry.department.name.toLowerCase().includes(query) ||
                entry.department.code.toLowerCase().includes(query)
            );
        });
    }, [departmentState, searchQuery]);

    const assignedCount = departmentState.filter((entry) => entry.isAssigned).length;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSearchQuery("");
            setDepartmentState([]);
        }
        onOpenChange(nextOpen);
    };

    const updateDepartmentState = (departmentId: string, isAssigned: boolean) => {
        setDepartmentState((currentState) =>
            currentState.map((entry) => {
                if (entry.departmentId !== departmentId) return entry;
                return { ...entry, isAssigned };
            })
        );
    };

    const handleAssignedChange = (departmentId: string, isAssigned: boolean) => {
        updateDepartmentState(departmentId, isAssigned);
    };

    const handleSave = async () => {
        if (!user?.id) return;

        const payload = departmentState
            .filter((entry) => entry.isAssigned)
            .map((entry) => ({
                departmentId: entry.departmentId,
                isEnabled: true,
            }));

        setIsSaving(true);
        try {
            const result = await updateUserDepartmentAssignments(user.id, payload);
            if (result?.success) {
                notify.success("Department access updated.");
                onSaved?.();
                handleOpenChange(false);
            } else {
                notify.error(result?.error || "Failed to update department access.");
            }
        } catch {
            notify.error("Failed to update department access.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col p-0 gap-0 sm:max-w-3xl bg-white shadow-2xl">
                <div className="flex-none px-8 pt-6 pb-4">
                    <SheetHeader className="text-left p-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Users size={24} weight="fill" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-xl font-bold text-slate-800">Manage Department Access</SheetTitle>
                                <SheetDescription className="text-sm text-slate-500 font-medium mt-0.5">
                                    Quickly toggle visibility and status for triage staff.
                                </SheetDescription>
                            </div>
                        </div>

                        {user ? (
                            <div className="grid grid-cols-3 gap-4 pt-5">
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Staff Member</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-sm text-slate-500 font-medium truncate">{user.email}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800 uppercase truncate">{user.role.replace("_", " ")}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800">Currently Assigned: {assignedCount} / {departmentState.length}</p>
                                </div>
                            </div>
                        ) : null}
                    </SheetHeader>
                </div>

                <div className="flex-none px-10 pt-2 pb-2">
                    <div className="relative">
                        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search department name or code..."
                            className="pl-10 h-11 bg-white border-slate-200 text-[15px] shadow-sm rounded-lg placeholder:text-slate-400 focus-visible:ring-emerald-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 pb-4 pt-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Department Access List</span>
                        <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-[11px] border">
                            Currently Assigned: {assignedCount} / {departmentState.length}
                        </Badge>
                    </div>

                    <div className="space-y-3 pb-4 border-b border-transparent">
                        {isLoading ? (
                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                Loading department assignments...
                            </div>
                        ) : filteredDepartments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                No departments match your search.
                            </div>
                        ) : (
                            filteredDepartments.map((entry) => (
                                <div
                                    key={entry.departmentId}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleAssignedChange(entry.departmentId, !entry.isAssigned)}
                                    onKeyDown={(event) => {
                                        if (event.key === " " || event.key === "Enter") {
                                            event.preventDefault();
                                            handleAssignedChange(entry.departmentId, !entry.isAssigned);
                                        }
                                    }}
                                    className={cn(
                                        "rounded-xl border bg-white p-4 cursor-pointer transition-colors",
                                        entry.isAssigned ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300"
                                    )}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={entry.isAssigned}
                                                onCheckedChange={(checked) => handleAssignedChange(entry.departmentId, Boolean(checked))}
                                                onClick={(event) => event.stopPropagation()}
                                                aria-label={`Toggle access for ${entry.department.name}`}
                                                disabled={isSaving}
                                            />
                                            <p className="text-[13px] font-bold text-slate-800 uppercase">{entry.department.name}</p>
                                            <Badge variant="secondary" className="bg-slate-200 hover:bg-slate-200/60 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded border border-slate-300 px-2 py-0.5">
                                                {entry.department.code}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 sm:pr-2">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Access Status</span>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest rounded border px-2 py-0.5",
                                                    entry.isAssigned
                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}
                                            >
                                                {entry.isAssigned ? "Enabled" : "Disabled"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-none border-t border-slate-100 px-10 py-6 bg-slate-50/50">
                    <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                        <Button variant="outline" className="h-12 w-full rounded-xl font-bold text-slate-600 border-slate-200 shadow-sm" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm" onClick={handleSave} disabled={isSaving || isLoading || !user}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}