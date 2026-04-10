"use client";

import { createDepartment, deleteDepartment } from "@/features/admin/department-actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notify } from "@/shared/lib/notify";
import { Department } from "@/shared/types/models";
import { cn } from "@/shared/lib/utils";
import { Funnel, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createQueueOption, deleteQueueOption } from "../../queue-option-actions";
import { PriorityCategory } from "@/shared/types/models";

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
            setQueueError(result.error || "Failed to add queue option.");
            setQueueLoading(false);
            return;
        }

        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: [...(prev[selectedDepartmentKey] ?? []), result.data],
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
            setQueueError(result.error || "Failed to delete queue option.");
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
            <section className="rounded-2xl border border-border/60 bg-linear-to-r from-emerald-50 via-white to-teal-50 px-5 py-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black tracking-tight text-emerald-950">Departmental Hub</h1>
                        <p className="max-w-2xl text-sm text-emerald-900/70">
                            Manage hierarchies, operational codes, and queue configuration through focused department workspaces.
                        </p>
                    </div>
                    <Button
                        className="h-11 rounded-xl bg-emerald-900 px-5 font-bold hover:bg-emerald-800"
                        onClick={() => {
                            setError("");
                            setIsAddDepartmentOpen(true);
                        }}
                    >
                        <Plus size={16} className="mr-2" />
                        Add New Department
                    </Button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                    <div className="relative">
                        <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search by name, code, or lead officer..."
                            className="h-10 rounded-xl bg-white pl-9"
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3">
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

                    <div className="flex items-center gap-2 rounded-xl border bg-white px-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sort</span>
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
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                                className="group rounded-2xl border border-border/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <CardContent className="space-y-4 p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-lg font-black tracking-tight text-foreground">{department.name}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Code: {department.code}</p>
                                        </div>
                                        <Badge
                                            variant={hasPriority ? "default" : "secondary"}
                                            className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                hasPriority ? "bg-emerald-700 text-white" : ""
                                            )}
                                        >
                                            {hasPriority ? "High Priority" : "Active"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1 text-sm">
                                        <p className="flex items-center justify-between gap-3 text-muted-foreground">
                                            <span>Lead Officer</span>
                                            <span className="font-semibold text-foreground">{insight.leadOfficer}</span>
                                        </p>
                                        <p className="flex items-center justify-between gap-3 text-muted-foreground">
                                            <span>Staff Count</span>
                                            <span className="font-semibold text-foreground">{insight.staffCount} Members</span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            className="h-9 flex-1 rounded-lg bg-emerald-900 text-xs font-bold uppercase tracking-wider hover:bg-emerald-800"
                                            onClick={() => openManageDialog(department.id)}
                                        >
                                            Manage
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <Card className="col-span-full rounded-2xl border-dashed">
                        <CardContent className="py-16 text-center">
                            <p className="text-sm font-semibold text-muted-foreground">No departments match your current search and filters.</p>
                        </CardContent>
                    </Card>
                )}
            </section>

            <Dialog open={isAddDepartmentOpen} onOpenChange={setIsAddDepartmentOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Department</DialogTitle>
                        <DialogDescription>
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
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{selectedDepartment?.name ?? "Department"}</DialogTitle>
                        <DialogDescription>
                            Edit department details and queue options in one place.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDepartment ? (
                        <Tabs defaultValue="department-info" className="space-y-4">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="department-info">Department Info</TabsTrigger>
                                <TabsTrigger value="queue-options">Queue Options</TabsTrigger>
                            </TabsList>

                            <TabsContent value="department-info" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={infoDraft.name}
                                            onChange={(event) =>
                                                setInfoDraft((prev) => ({ ...prev, name: event.target.value }))
                                            }
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Code</Label>
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

                                <Alert variant="warning" className="rounded-xl">
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
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="text-sm font-semibold">Add Queue Option</p>
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
                                        <Label htmlFor="queue-priority">Mark as priority</Label>
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
                                        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
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
                                                        <Badge className="bg-amber-100 text-amber-800">Priority</Badge>
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
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
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
