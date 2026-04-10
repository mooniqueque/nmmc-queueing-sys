"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
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
    isEnabled: boolean;
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
            isEnabled: assigned?.isEnabled ?? false,
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

    const updateDepartmentState = (
        departmentId: string,
        updater: (current: DepartmentAccessState) => DepartmentAccessState
    ) => {
        setDepartmentState((currentState) =>
            currentState.map((entry) => {
                if (entry.departmentId !== departmentId) return entry;
                return updater(entry);
            })
        );
    };

    const handleAssignedChange = (departmentId: string, isAssigned: boolean) => {
        updateDepartmentState(departmentId, (current) => ({
            ...current,
            isAssigned,
            isEnabled: isAssigned ? true : false,
        }));
    };

    const handleEnabledChange = (departmentId: string, isEnabled: boolean) => {
        updateDepartmentState(departmentId, (current) => ({
            ...current,
            isEnabled,
        }));
    };

    const handleSave = async () => {
        if (!user?.id) return;

        const payload = departmentState
            .filter((entry) => entry.isAssigned)
            .map((entry) => ({
                departmentId: entry.departmentId,
                isEnabled: entry.isEnabled,
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
            <SheetContent className="w-full sm:max-w-2xl">
                <div className="flex h-full flex-col">
                    <SheetHeader className="space-y-4 border-b pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                                <Users size={22} weight="fill" />
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="text-xl">Manage Department Access</SheetTitle>
                                <SheetDescription>
                                    Control which departments this triage nurse can see and whether each one is active.
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
                            <span className="font-medium text-foreground">Department access list</span>
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
                                            entry.isAssigned ? "border-emerald-200 bg-emerald-50/50" : "bg-background"
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
                                                    Assign access, then keep the department active or temporarily disabled.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Assigned</p>
                                                        <p className="text-xs text-muted-foreground">Add or remove</p>
                                                    </div>
                                                    <Switch
                                                        checked={entry.isAssigned}
                                                        onCheckedChange={(checked) => handleAssignedChange(entry.departmentId, checked)}
                                                        disabled={isSaving}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Enabled</p>
                                                        <p className="text-xs text-muted-foreground">Toggle access</p>
                                                    </div>
                                                    <Switch
                                                        checked={entry.isAssigned && entry.isEnabled}
                                                        onCheckedChange={(checked) => handleEnabledChange(entry.departmentId, checked)}
                                                        disabled={!entry.isAssigned || isSaving}
                                                    />
                                                </div>
                                            </div>
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
                        <Button onClick={handleSave} disabled={isSaving || isLoading || !user}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
}