"use client";

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
import { createDepartment, deleteDepartment } from "@/features/admin/department-actions";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { Department } from "@/shared/types/models";
import { Funnel, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

function insertCategory(
    categories: PriorityCategory[],
    category: PriorityCategory,
    parentId?: string
): PriorityCategory[] {
    if (!parentId) {
        return [...categories, category];
    }

    let matched = false;
    const next = categories.map((item) => {
        if (item.id === parentId) {
            matched = true;
            return {
                ...item,
                children: [...(item.children ?? []), category],
            };
        }

        if (Array.isArray(item.children) && item.children.length > 0) {
            const updatedChildren = insertCategory(item.children, category, parentId);
            if (updatedChildren !== item.children) {
                matched = true;
                return { ...item, children: updatedChildren };
            }
        }

        return item;
    });

    return matched ? next : [...categories, category];
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
    const [filterMode, setFilterMode] = useState<"ALL" | "PRIORITY" | "WITHOUT_CATEGORIES">("ALL");
    const [sortMode, setSortMode] = useState<"NAME_ASC" | "NAME_DESC" | "CODE_ASC" | "STAFF_DESC">("NAME_ASC");
    const [isAddDepartmentOpen, setIsAddDepartmentOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);

    const [queueNameInput, setQueueNameInput] = useState("");
    const [queueCodeInput, setQueueCodeInput] = useState("");
    const [isPriorityInput, setIsPriorityInput] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0]?.id ?? "");

    const [categoryNameInput, setCategoryNameInput] = useState("");
    const [categoryCodeInput, setCategoryCodeInput] = useState("");
    const [categoryParentId, setCategoryParentId] = useState("");
    const [isCategoryPriority, setIsCategoryPriority] = useState(false);

    const [queueOptionsByDepartment, setQueueOptionsByDepartment] = useState(initialQueueOptionsByDepartment);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState("");
    const [infoDraft, setInfoDraft] = useState({ name: "", code: "" });

    const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);
    const selectedDepartmentKey = selectedDepartment ? normalizeDepartmentKey(selectedDepartment.name) : "";
    const categoryTree = selectedDepartment
        ? (queueOptionsByDepartment[selectedDepartmentKey] ?? [])
        : [];
    const categories = flattenCategories(categoryTree);

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
            if (result?.data?.id) {
                setDepartments((prev) => [...prev, result.data as Department]);
            }
            router.refresh();
        } else {
            setError(result.error || "Failed to create department");
        }
        setLoading(false);
    };

    const handleAddQueueOption = async (mode: "QUEUE_OPTION" | "CATEGORY") => {
        if (!selectedDepartment) {
            setQueueError("Select a department first.");
            return;
        }

        const isCategoryMode = mode === "CATEGORY";
        const nameValue = isCategoryMode ? categoryNameInput : queueNameInput;
        const codeValue = isCategoryMode ? categoryCodeInput : queueCodeInput;
        const priorityValue = isCategoryMode ? isCategoryPriority : isPriorityInput;
        const parentId = isCategoryMode && categoryParentId ? categoryParentId : undefined;

        if (!nameValue || !codeValue) {
            setQueueError("Name and Code are required.");
            return;
        }

        setQueueLoading(true);
        setQueueError("");

        const result = await createQueueOption(selectedDepartment.name, {
            name: nameValue.trim(),
            code: codeValue.trim().toUpperCase(),
            isPriority: priorityValue,
            parentId
        });

        if (!result.success) {
            setQueueError(result.error || "Failed to add queue option.");
            setQueueLoading(false);
            return;
        }

        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: insertCategory(
                prev[selectedDepartmentKey] ?? [],
                result.data,
                parentId
            )
        }));

        if (isCategoryMode) {
            setCategoryNameInput("");
            setCategoryCodeInput("");
            setCategoryParentId("");
            setIsCategoryPriority(false);
        } else {
            setQueueNameInput("");
            setQueueCodeInput("");
            setIsPriorityInput(false);
        }

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
        if (!confirm("Are you sure you want to delete this department?")) return;

        const result = await deleteDepartment(id);
        if (!result.success) {
            notify.error(result.error || "Failed to delete department");
            return;
        }

        setDepartments((prev) => prev.filter((item) => item.id !== id));
        setIsManageOpen(false);
        router.refresh();
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
                (filterMode === "WITHOUT_CATEGORIES" && departmentCategories.length === 0);

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
                            onChange={(event) => setFilterMode(event.target.value as "ALL" | "PRIORITY" | "WITHOUT_CATEGORIES")}
                            className="h-10 bg-transparent text-sm font-medium outline-none"
                        >
                            <option value="ALL">All</option>
                            <option value="PRIORITY">High Priority</option>
                            <option value="WITHOUT_CATEGORIES">No Categories</option>
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

                        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

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
                            Edit department context, queue options, and category structure without crowding the main dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDepartment ? (
                        <Tabs defaultValue="department-info" className="space-y-4">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="department-info">Department Info</TabsTrigger>
                                <TabsTrigger value="queue-options">Queue Options</TabsTrigger>
                                <TabsTrigger value="categories">Categories</TabsTrigger>
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

                                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                    <p className="text-sm font-semibold text-destructive">Danger Zone</p>
                                    <p className="mt-1 text-xs text-destructive/90">Deleting a department removes it from active settings.</p>
                                    <Button
                                        variant="destructive"
                                        className="mt-3"
                                        onClick={() => handleDelete(selectedDepartment.id)}
                                    >
                                        <Trash size={14} className="mr-2" />
                                        Delete Department
                                    </Button>
                                </div>
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
                                        onClick={() => handleAddQueueOption("QUEUE_OPTION")}
                                        disabled={queueLoading}
                                    >
                                        {queueLoading ? "Adding..." : "Add Queue Option"}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {categories.length === 0 ? (
                                        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                                            No queue options configured.
                                        </p>
                                    ) : (
                                        categories.map((cat) => (
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

                            <TabsContent value="categories" className="space-y-4">
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="text-sm font-semibold">Add Category</p>
                                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <Input
                                            placeholder="Category Name"
                                            value={categoryNameInput}
                                            onChange={(event) => setCategoryNameInput(event.target.value)}
                                        />
                                        <Input
                                            placeholder="Category Code"
                                            value={categoryCodeInput}
                                            onChange={(event) => setCategoryCodeInput(event.target.value)}
                                            className="uppercase"
                                        />
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <Label>Parent Category (Optional)</Label>
                                        <select
                                            value={categoryParentId}
                                            onChange={(event) => setCategoryParentId(event.target.value)}
                                            className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                                        >
                                            <option value="">None (top-level)</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Checkbox
                                            id="category-priority"
                                            checked={isCategoryPriority}
                                            onCheckedChange={(checked) => setIsCategoryPriority(Boolean(checked))}
                                        />
                                        <Label htmlFor="category-priority">Priority category</Label>
                                    </div>
                                    <Button
                                        type="button"
                                        className="mt-4"
                                        onClick={() => handleAddQueueOption("CATEGORY")}
                                        disabled={queueLoading}
                                    >
                                        {queueLoading ? "Adding..." : "Add Category"}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {categories.length === 0 ? (
                                        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                                            No categories configured.
                                        </p>
                                    ) : (
                                        categories.map((cat) => (
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

                    {queueError ? <p className="text-sm font-medium text-destructive">{queueError}</p> : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
