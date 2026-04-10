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
            <SheetContent className="w-full sm:max-w-2xl">
                <div className="flex h-full flex-col">
                    <SheetHeader className="space-y-4 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                                <Users size={22} weight="fill" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-xl">Manage Department Access</SheetTitle>
                                <SheetDescription>
                                    Control which departments this clinic caller can receive patients from.
                                </SheetDescription>
                            </div>
                        </div>

                        {user ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Selected Staff</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <div className="rounded-2xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Role</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{user.role.replace("_", " ")}</p>
                                </div>
                                <div className="rounded-2xl border bg-muted/30 p-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assigned</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">{assignedCount} departments</p>
                                </div>
                            </div>
                        ) : null}
                    </SheetHeader>

                    <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-1">
                        <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assigned Station</p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                        {assignedWorkstation ? `${assignedWorkstation.name} (#${assignedWorkstation.stationNo})` : "No Station Assigned"}
                                    </p>
                                </div>
                                <Badge variant="outline" className="uppercase text-[10px] tracking-wide">
                                    Linked Department
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Department Linked To This Station</Label>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <Select
                                        value={linkedDepartmentId}
                                        onValueChange={setLinkedDepartmentId}
                                        disabled={!assignedWorkstation || isStationSaving || isSaving}
                                    >
                                        <SelectTrigger className="sm:flex-1">
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
                                        className="sm:w-auto"
                                    >
                                        {isStationSaving ? "Updating..." : "Update Station Link"}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Clinic caller access below is fixed to this station-linked department.
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search department name or code..."
                                className="pl-9"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                            <span className="font-medium text-foreground">Department access list (station-linked)</span>
                            <Badge variant="outline" className="font-semibold uppercase tracking-wide">
                                {assignedCount}/{departmentState.length}
                            </Badge>
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Loading department assignments...
                                </div>
                            ) : filteredDepartments.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    No departments match your search.
                                </div>
                            ) : (
                                filteredDepartments.map((entry) => (
                                    <div
                                        key={entry.departmentId}
                                        className={cn(
                                            "rounded-2xl border p-4 transition-colors",
                                            entry.departmentId === linkedDepartmentId ? "border-blue-200 bg-blue-50/50" : "bg-background"
                                        )}
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-sm font-semibold text-foreground">{entry.department.name}</p>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em]">
                                                        {entry.department.code}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Access follows the clinic caller station link.
                                                </p>
                                            </div>

                                            <Badge
                                                variant={entry.departmentId === linkedDepartmentId ? "default" : "outline"}
                                                className="uppercase tracking-wide text-[10px]"
                                            >
                                                {entry.departmentId === linkedDepartmentId ? "Assigned via Station" : "Not Assigned"}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <SheetFooter className="border-t pt-4 sm:justify-end">
                        <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || isLoading || !user || isStationSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}
