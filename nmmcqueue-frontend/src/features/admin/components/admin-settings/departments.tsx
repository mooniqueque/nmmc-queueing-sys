"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createDepartment, deleteDepartment, updateDepartmentStatus } from "@/features/admin/department-actions";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { Department, DepartmentStatus, PriorityCategory } from "@/shared/types/models";
import { Funnel, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createQueueOption, deleteQueueOption } from "../../queue-option-actions";

type QueueOptionsByDepartment = Record<string, PriorityCategory[]>;

type DepartmentInsight = {
    leadOfficer: string;
    staffCount: number;
};

type DepartmentSettingsProps = {
    initialDepartments: Department[];
    initialQueueOptionsByDepartment: QueueOptionsByDepartment;
    initialDepartmentInsights?: Record<string, DepartmentInsight>;
};

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

function flattenCategories(categories: PriorityCategory[]): PriorityCategory[] {
    const flat: PriorityCategory[] = [];

    const walk = (items: PriorityCategory[]) => {
        for (const item of items) {
            flat.push(item);
            if (Array.isArray(item.children) && item.children.length > 0) {
                walk(item.children);
            }
        }
    };

    walk(categories);
    return flat;
}

function removeCategory(categories: PriorityCategory[], targetId: string): PriorityCategory[] {
    return categories
        .filter((item) => item.id !== targetId)
        .map((item) => ({
            ...item,
            children: item.children ? removeCategory(item.children, targetId) : item.children,
        }));
}


export default function DepartmentSettings({
    initialDepartments,
    initialQueueOptionsByDepartment,
    initialDepartmentInsights = {}
}: DepartmentSettingsProps) {
    const router = useRouter();
    const [departments, setDepartments] = useState(initialDepartments);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMode, setFilterMode] = useState<"ALL" | "PRIORITY" | "WITHOUT_QUEUE_OPTIONS">("ALL");
    const [sortMode, setSortMode] = useState<"NAME_ASC" | "NAME_DESC" | "CODE_ASC" | "STAFF_DESC">("NAME_ASC");
    const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const [queueNameInput, setQueueNameInput] = useState("");
    const [queueCodeInput, setQueueCodeInput] = useState("");
    const [isPriorityInput, setIsPriorityInput] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0]?.id ?? "");

    const [queueOptionsByDepartment, setQueueOptionsByDepartment] = useState(initialQueueOptionsByDepartment);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState("");
    const [infoDraft, setInfoDraft] = useState({ name: "", code: "" });
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [pendingDeleteDepartmentId, setPendingDeleteDepartmentId] = useState<string | null>(null);
    const [isDeletingDepartment, setIsDeletingDepartment] = useState(false);

    useEffect(() => {
        setDepartments(initialDepartments);
        setQueueOptionsByDepartment(initialQueueOptionsByDepartment);
        setSelectedDepartmentId((prev) => {
            if (prev && initialDepartments.some((department) => department.id === prev)) {
                return prev;
            }
            return initialDepartments[0]?.id ?? "";
        });
    }, [initialDepartments, initialQueueOptionsByDepartment]);

    const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);
    const selectedDepartmentKey = selectedDepartment ? normalizeDepartmentKey(selectedDepartment.name) : "";
    const queueOptionTree = selectedDepartment
        ? (queueOptionsByDepartment[selectedDepartmentKey] ?? [])
        : [];
    const queueOptions = flattenCategories(queueOptionTree);

    const openManageDialog = (departmentId: string) => {
        const department = departments.find((item) => item.id === departmentId);
        if (!department) return;
        setSelectedDepartmentId(departmentId);
        setInfoDraft({ name: department.name, code: department.code });
        setQueueError("");
        setIsManageOpen(true);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await createDepartment(name, code);

        if (result.success) {
            setName("");
            setCode("");
            setIsAddDepartmentOpen(false);
            router.refresh();
        } else {
            setError(result.error || "Failed to create department");
        }
        setLoading(false);
    };

    const handleAddQueueOption = async () => {
        if (!selectedDepartment) {
            setQueueError("Select a department first.");
            return;
        }

        if (!queueNameInput || !queueCodeInput) {
            setQueueError("Name and Code are required.");
            return;
        }

        setQueueLoading(true);
        setQueueError("");

        const result = await createQueueOption(selectedDepartment.name, {
            name: queueNameInput.trim(),
            code: queueCodeInput.trim().toUpperCase(),
            isPriority: isPriorityInput,
        });

        if (!result.success) {
            const message = result.error || "Failed to add queue option.";
            setQueueError(message);
            notify.error(message);
            setQueueLoading(false);
            return;
        }

        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: [
                ...(prev[selectedDepartmentKey] ?? []),
                ...(result.data ? [result.data] : []),
            ],
        }));

        setQueueNameInput("");
        setQueueCodeInput("");
        setIsPriorityInput(false);

        setQueueLoading(false);
    };

    const handleDeleteQueueOption = async (id: string) => {
        if (!selectedDepartment) return;

        setQueueLoading(true);
        const result = await deleteQueueOption(id);

        if (result.success) {
            setQueueOptionsByDepartment((prev) => ({
                ...prev,
                [selectedDepartmentKey]: removeCategory(prev[selectedDepartmentKey] ?? [], id),
            }));
        } else {
            const message = result.error || "Failed to delete queue option.";
            setQueueError(message);
            notify.error(message);
        }
        setQueueLoading(false);
    };

    const handleDelete = async (id: string) => {
        setIsDeletingDepartment(true);
        const result = await deleteDepartment(id);
        if (!result.success) {
            notify.error(result.error || "Failed to delete department");
            setIsDeletingDepartment(false);
            return;
        }

        setDepartments((prev) => prev.filter((item) => item.id !== id));
        setIsManageOpen(false);
        setIsDeleteConfirmOpen(false);
        setPendingDeleteDepartmentId(null);
        setIsDeletingDepartment(false);
        router.refresh();
    };

    const handleQueueStatusChange = async (departmentId: string, nextOpen: boolean) => {
        const nextStatus: DepartmentStatus = nextOpen ? DepartmentStatus.OPEN : DepartmentStatus.CLOSED;
        const result = await updateDepartmentStatus(departmentId, nextStatus);

        if (!result.success) {
            notify.error(result.error || "Failed to update department queue status.");
            return;
        }

        setDepartments((current) =>
            current.map((department) => (
                department.id === departmentId
                    ? { ...department, status: nextStatus }
                    : department
            ))
        );
        router.refresh();
    };

    const openDeleteConfirm = (id: string) => {
        setPendingDeleteDepartmentId(id);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!pendingDeleteDepartmentId) return;
        await handleDelete(pendingDeleteDepartmentId);
    };

    const filteredDepartments = departments
        .filter((department) => {
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !query ||
                department.name.toLowerCase().includes(query) ||
                department.code.toLowerCase().includes(query) ||
                (initialDepartmentInsights[department.id]?.leadOfficer ?? "").toLowerCase().includes(query);

            const departmentCategories = flattenCategories(
                queueOptionsByDepartment[normalizeDepartmentKey(department.name)] ?? []
            );
            const hasPriority = departmentCategories.some((category) => category.isPriority);

            const matchesFilter =
                filterMode === "ALL" ||
                (filterMode === "PRIORITY" && hasPriority) ||
                (filterMode === "WITHOUT_QUEUE_OPTIONS" && departmentCategories.length === 0);

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortMode === "NAME_DESC") return b.name.localeCompare(a.name);
            if (sortMode === "CODE_ASC") return a.code.localeCompare(b.code);
            if (sortMode === "STAFF_DESC") {
                const aCount = initialDepartmentInsights[a.id]?.staffCount ?? 0;
                const bCount = initialDepartmentInsights[b.id]?.staffCount ?? 0;
                return bCount - aCount;
            }
            return a.name.localeCompare(b.name);
        });

    const hasDepartments = filteredDepartments.length > 0;

    return (
        <div className="space-y-6">
            <section className="space-y-4 rounded-lg border bg-card p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                    <div className="relative">
                        <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search departments, clinics or services....."
                            className="h-10 pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                        <Funnel size={14} className="text-muted-foreground" />
                        <select
                            value={filterMode}
                            onChange={(event) => setFilterMode(event.target.value as "ALL" | "PRIORITY" | "WITHOUT_QUEUE_OPTIONS")}
                            className="h-10 bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="ALL">All</option>
                            <option value="PRIORITY">High Priority</option>
                            <option value="WITHOUT_QUEUE_OPTIONS">No Queue Options</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 rounded-md border bg-background px-3">
                        <span className="text-xs font-medium text-muted-foreground">Sort</span>
                        <select
                            value={sortMode}
                            onChange={(event) =>
                                setSortMode(event.target.value as "NAME_ASC" | "NAME_DESC" | "CODE_ASC" | "STAFF_DESC")
                            }
                            className="h-10 bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="NAME_ASC">Name A-Z</option>
                            <option value="NAME_DESC">Name Z-A</option>
                            <option value="CODE_ASC">Code A-Z</option>
                            <option value="STAFF_DESC">Most Staff</option>
                        </select>
                    </div>

                    <Button
                        className="h-10 px-5"
                        onClick={() => {
                            setError("");
                            setIsAddDepartmentOpen(true);
                        }}
                    >
                        <Plus size={16} className="mr-2" />
                        Add New Department
                    </Button>
                </div>

                <h2 className="text-lg font-semibold tracking-tight text-foreground">All Departments</h2>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {hasDepartments ? (
                    filteredDepartments.map((department) => {
                        const insight = initialDepartmentInsights[department.id] ?? {
                            leadOfficer: "Unassigned",
                            staffCount: 0,
                        };
                        const departmentCategories = flattenCategories(
                            queueOptionsByDepartment[normalizeDepartmentKey(department.name)] ?? []
                        );
                        const hasPriority = departmentCategories.some((category) => category.isPriority);

                        return (
                            <Card 
                                key={department.id} 
                                className="group relative overflow-hidden border bg-card shadow-sm transition-colors hover:bg-muted/40 cursor-pointer"
                                onClick={() => openManageDialog(department.id)}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="h-10 w-1.5 rounded-full bg-emerald-600" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="truncate text-base font-semibold tracking-tight">{department.name}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Code {department.code} · {insight.staffCount} staff
                                        </p>
                                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className={cn("size-2 rounded-full", department.status === DepartmentStatus.CLOSED ? "bg-slate-400" : department.status === DepartmentStatus.FULL ? "bg-amber-500" : "bg-emerald-500")} />
                                            <span>{department.status ?? DepartmentStatus.OPEN}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center justify-center rounded-md border bg-background p-2 text-muted-foreground transition-colors group-hover:text-emerald-700">
                                        <Gear size={18} weight="bold" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="py-16 text-center">
                            <p className="text-sm font-semibold text-muted-foreground">No departments match your current search and filters.</p>
                        </CardContent>
                    </Card>
                )}
            </section>

            <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Add New Department</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Keep this quick. Capture only the essentials and configure details later.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Dental Clinic"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g. DEN"
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                required
                                maxLength={8}
                                className="font-mono uppercase"
                            />
                        </div>

                        {error ? (
                            <Alert variant="error">
                                <AlertTitle>Unable to create department</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : null}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddDepartmentOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : "Create Department"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">{selectedDepartment?.name ?? "Department"}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Edit department details and queue options in one place.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDepartment ? (
                        <Tabs defaultValue="department-info" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
                                <TabsTrigger value="department-info">Department Info</TabsTrigger>
                                <TabsTrigger value="queue-options">Queue Options</TabsTrigger>
                            </TabsList>

                            <TabsContent value="department-info" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Name</Label>
                                        <Input
                                            value={infoDraft.name}
                                            onChange={(event) =>
                                                setInfoDraft((prev) => ({ ...prev, name: event.target.value }))
                                            }
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Code</Label>
                                        <Input
                                            value={infoDraft.code}
                                            onChange={(event) =>
                                                setInfoDraft((prev) => ({ ...prev, code: event.target.value }))
                                            }
                                            disabled
                                            className="font-mono uppercase"
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground">
                                    Department identity fields are currently read-only in this release.
                                </p>

                                <Alert variant="warning">
                                    <AlertCircle className="size-4" />
                                    <AlertTitle>Danger Zone</AlertTitle>
                                    <AlertDescription>Deleting a department removes it from active settings.</AlertDescription>
                                    <div className="col-start-2 mt-3">
                                        <Button
                                            variant="destructive"
                                            onClick={() => openDeleteConfirm(selectedDepartment.id)}
                                        >
                                            <Trash size={14} className="mr-2" />
                                            Delete Department
                                        </Button>
                                    </div>
                                </Alert>
                            </TabsContent>

                            <TabsContent value="queue-options" className="space-y-4">
                                <div className="rounded-lg border bg-card p-4 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Enable Ticket Assignment</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                When closed, Triage staff cannot assign new patients to this department regardless of their individual access.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 rounded-full border bg-muted/40 px-3 py-2">
                                            <span className="text-xs font-medium text-muted-foreground">Closed</span>
                                            <Switch
                                                checked={selectedDepartment.status === DepartmentStatus.OPEN}
                                                onCheckedChange={(checked) => handleQueueStatusChange(selectedDepartment.id, checked)}
                                            />
                                            <span className="text-xs font-medium text-muted-foreground">Open</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-card p-4">
                                    <p className="text-sm font-medium">Add Queue Option</p>
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Input
                                            placeholder="Option Name"
                                            value={queueNameInput}
                                            onChange={(event) => setQueueNameInput(event.target.value)}
                                        />
                                        <Input
                                            placeholder="Option Code"
                                            value={queueCodeInput}
                                            onChange={(event) => setQueueCodeInput(event.target.value)}
                                            className="uppercase"
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Checkbox
                                            id="queue-priority"
                                            checked={isPriorityInput}
                                            onCheckedChange={(checked) => setIsPriorityInput(Boolean(checked))}
                                        />
                                        <Label htmlFor="queue-priority" className="text-sm font-medium">Mark as priority</Label>
                                    </div>
                                    <Button
                                        type="button"
                                        className="mt-4"
                                        onClick={handleAddQueueOption}
                                        disabled={queueLoading}
                                    >
                                        {queueLoading ? "Adding..." : "Add Queue Option"}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {queueOptions.length === 0 ? (
                                        <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                                            No queue options configured.
                                        </p>
                                    ) : (
                                        queueOptions.map((cat) => (
                                            <div
                                                key={cat.id}
                                                className="flex items-center justify-between rounded-xl border bg-white px-3 py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold">{cat.name}</p>
                                                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                                        {cat.code}
                                                    </Badge>
                                                    {cat.isPriority ? (
                                                        <Badge variant="secondary">Priority</Badge>
                                                    ) : null}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteQueueOption(cat.id)}
                                                    className="size-8"
                                                >
                                                    <Trash size={14} />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : null}

                    {queueError ? (
                        <Alert variant="error">
                            <AlertTitle>Queue option error</AlertTitle>
                            <AlertDescription>{queueError}</AlertDescription>
                        </Alert>
                    ) : null}
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDeleteConfirmOpen}
                onOpenChange={(open) => {
                    if (isDeletingDepartment) return;
                    setIsDeleteConfirmOpen(open);
                    if (!open) setPendingDeleteDepartmentId(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Delete Department</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            This action cannot be undone. The department will be removed from active settings.
                        </DialogDescription>
                    </DialogHeader>

                    <Alert variant="warning">
                        <AlertCircle className="size-4" />
                        <AlertTitle>Confirm deletion</AlertTitle>
                        <AlertDescription>
                            Please confirm if you want to permanently delete this department.
                        </AlertDescription>
                    </Alert>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsDeleteConfirmOpen(false);
                                setPendingDeleteDepartmentId(null);
                            }}
                            disabled={isDeletingDepartment}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={isDeletingDepartment}
                        >
                            {isDeletingDepartment ? "Deleting..." : "Delete Department"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
