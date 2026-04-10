"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getDepartments } from "@/features/shared/api";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { UserData } from "@/shared/types/auth";
import { Department, WorkStation } from "@/shared/types/models";
import { MagnifyingGlass, Users } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { getUserDepartmentAssignments, updateUserDepartmentAssignments } from "../user-actions";
import { updateWorkstation } from "../workstation-actions";

type DepartmentAccessState = {
    departmentId: string;
    department: Department;
    isAssigned: boolean;
    isEnabled: boolean;
};

type DepartmentAccessResponse = {
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
            isEnabled: assigned?.isEnabled ?? false,
        };
    });
}

interface ManageClinicCallerDepartmentsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserData | null;
    workstations?: WorkStation[];
    onSaved?: () => void;
}

export function ManageClinicCallerDepartmentsDrawer({
    open,
    onOpenChange,
    user,
    workstations = [],
    onSaved,
}: ManageClinicCallerDepartmentsDrawerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isStationSaving, setIsStationSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentState, setDepartmentState] = useState<DepartmentAccessState[]>([]);
    const [linkedDepartmentId, setLinkedDepartmentId] = useState<string>("none");

    const assignedWorkstation = useMemo(() => {
        if (!user?.workstationId) return null;
        return workstations.find((ws) => ws.id === user.workstationId) ?? null;
    }, [user?.workstationId, workstations]);

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
                if (assignedWorkstation?.departmentId) {
                    setLinkedDepartmentId(assignedWorkstation.departmentId);
                } else if (assignments[0]?.departmentId) {
                    setLinkedDepartmentId(assignments[0].departmentId);
                } else {
                    setLinkedDepartmentId("none");
                }
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
    }, [open, user?.id, assignedWorkstation?.departmentId]);

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

    const assignedCount = linkedDepartmentId === "none" ? 0 : 1;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setSearchQuery("");
            setDepartmentState([]);
            setLinkedDepartmentId("none");
        }
        onOpenChange(nextOpen);
    };

    const handleSaveStationLink = async () => {
        if (!assignedWorkstation?.id) {
            notify.error("This clinic caller has no assigned station.");
            return;
        }

        setIsStationSaving(true);
        try {
            const result = await updateWorkstation(assignedWorkstation.id, {
                departmentId: linkedDepartmentId === "none" ? undefined : linkedDepartmentId,
            });

            if (result?.success) {
                notify.success("Station department link updated.");
                onSaved?.();
            } else {
                notify.error(result?.error || "Failed to update station department link.");
            }
        } catch {
            notify.error("Failed to update station department link.");
        } finally {
            setIsStationSaving(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;

        const payload = linkedDepartmentId === "none"
            ? []
            : [{ departmentId: linkedDepartmentId, isEnabled: true }];

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
                <div className="flex-shrink-0 px-8 pt-6 pb-4">
                    <SheetHeader className="text-left p-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <Users size={24} weight="fill" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-xl font-bold text-slate-800">Manage Department Access</SheetTitle>
                                <SheetDescription className="text-sm text-slate-500 font-medium mt-0.5">
                                    Control which departments this clinic caller can receive patients from.
                                </SheetDescription>
                            </div>
                        </div>

                        {user ? (
                            <div className="grid grid-cols-3 gap-4 pt-5">
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Staff</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800 truncate">{user.name}</p>
                                    <p className="text-sm text-slate-500 font-medium truncate">{user.email}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800 uppercase truncate">{user.role.replace("_", " ")}</p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col justify-center">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned</p>
                                    <p className="mt-1 text-[15px] font-bold text-slate-800">{assignedCount} Departments</p>
                                </div>
                            </div>
                        ) : null}
                    </SheetHeader>
                </div>

                <div className="flex-shrink-0 px-10 pt-2 pb-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
                            <div className="min-w-0 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Station</p>
                                    <Badge variant="secondary" className="bg-slate-200 hover:bg-slate-200/60 text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded px-1.5 py-0 border-0">
                                        LINKED
                                    </Badge>
                                </div>
                                <p className="mt-0.5 text-[14px] font-bold text-slate-800 truncate">
                                    {assignedWorkstation ? `${assignedWorkstation.name} (#${assignedWorkstation.stationNo})` : "No Station Assigned"}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                                <Select
                                    value={linkedDepartmentId}
                                    onValueChange={setLinkedDepartmentId}
                                    disabled={!assignedWorkstation || isStationSaving || isSaving}
                                >
                                    <SelectTrigger className="w-full sm:w-[240px] h-9 bg-white border-slate-200 text-[13px] shadow-sm rounded-lg focus:ring-emerald-500">
                                        <SelectValue placeholder="Select linked department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No linked department</SelectItem>
                                        {departmentState.map((entry) => (
                                            <SelectItem key={entry.departmentId} value={entry.departmentId}>
                                                {entry.department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSaveStationLink}
                                    disabled={!assignedWorkstation || isStationSaving || isSaving}
                                    className="h-9 px-4 font-bold text-[12px] text-slate-700 border-slate-200 rounded-lg shadow-sm"
                                >
                                    {isStationSaving ? "Updating..." : "Update Link"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 px-10 pt-2 pb-2">
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
                        <span className="text-[13px] font-bold uppercase tracking-widest text-slate-400">Department access list (station-linked)</span>
                        <Badge variant="secondary" className="bg-slate-100 hover:bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-[11px] border">
                            {assignedCount} / {departmentState.length} Selected
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
                            filteredDepartments.map((entry) => {
                                const isLinked = entry.departmentId === linkedDepartmentId;
                                return (
                                    <div
                                        key={entry.departmentId}
                                        className={cn(
                                            "rounded-xl border p-4 transition-colors",
                                            isLinked ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <p className="text-[13px] font-bold text-slate-800 uppercase">{entry.department.name}</p>
                                                <Badge variant="secondary" className={cn("text-[10px] font-bold uppercase tracking-widest rounded border px-2 py-0.5", isLinked ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-200 hover:bg-slate-200/60 text-slate-600 border-slate-300")}>
                                                    {entry.department.code}
                                                </Badge>
                                            </div>

                                            <div className={cn("flex border rounded-lg px-3 py-1.5 items-center justify-center sm:mr-2", isLinked ? "border-emerald-200 bg-emerald-100" : "border-slate-200 bg-slate-50")}>
                                                <span className={cn("text-[11px] font-bold uppercase tracking-widest", isLinked ? "text-emerald-700" : "text-slate-400")}>
                                                    {isLinked ? "Assigned via Station" : "Not Assigned"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 border-t border-slate-100 px-10 py-6 bg-slate-50/50">
                    <div className="grid grid-cols-[1fr_2fr] gap-4 w-full">
                        <Button variant="outline" className="h-12 w-full rounded-xl font-bold text-slate-600 border-slate-200 shadow-sm" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button className="h-12 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm" onClick={handleSave} disabled={isSaving || isLoading || !user || isStationSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
