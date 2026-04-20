"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWorkstation, deleteWorkstation, updateWorkstation } from "@/features/admin/workstation-actions";
import { notify } from "@/shared/lib/notify";
import { UserData } from "@/shared/types/auth";
import { Department, WorkStation, WorkstationQueueMode } from "@/shared/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type WorkstationListProps = {
    workstations: WorkStation[];
    departments: Department[];
    users: UserData[];
    onWorkstationsCreated?: (stations: WorkStation[]) => void;
    onWorkstationUpdated?: (station: WorkStation) => void;
    onWorkstationDeleted?: (id: string) => void;
};

const editWorkstationSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Station name must be at least 2 characters.")
        .max(80, "Station name must be at most 80 characters."),
    queueMode: z.nativeEnum(WorkstationQueueMode),
});

type EditWorkstationValues = z.infer<typeof editWorkstationSchema>;

export function WorkstationList({
    workstations,
    departments,
    users,
    onWorkstationsCreated,
    onWorkstationUpdated,
    onWorkstationDeleted,
}: WorkstationListProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [createType, setCreateType] = useState<"CALLER" | "TRIAGE" | "WINDOW">("WINDOW");
    const [createCustomName, setCreateCustomName] = useState("");
    const [createCount, setCreateCount] = useState<number>(1);
    const [isCreating, setIsCreating] = useState(false);
    const [pendingEditStation, setPendingEditStation] = useState<WorkStation | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const editForm = useForm<EditWorkstationValues>({
        resolver: zodResolver(editWorkstationSchema),
        defaultValues: {
            name: "",
            queueMode: WorkstationQueueMode.MIXED,
        },
    });

    const assignedCounts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const user of users) {
            if (!user.isActive || !user.workstationId) continue;
            counts.set(user.workstationId, (counts.get(user.workstationId) ?? 0) + 1);
        }
        return counts;
    }, [users]);

    const assignedNamesByStation = useMemo(() => {
        const grouped = new Map<string, string[]>();
        for (const user of users) {
            if (!user.isActive || !user.workstationId) continue;
            const existing = grouped.get(user.workstationId) ?? [];
            existing.push(user.name);
            grouped.set(user.workstationId, existing);
        }
        return grouped;
    }, [users]);

    const groupedWorkstations = useMemo(() => {
        const byType: Record<string, WorkStation[]> = {
            CALLER: [],
            TRIAGE: [],
            WINDOW: [],
        };

        for (const station of workstations) {
            if (station.type === "CALLER" && station.parentWorkstationId) {
                continue;
            }
            if (!byType[station.type]) continue;
            byType[station.type].push(station);
        }

        for (const key of Object.keys(byType)) {
            byType[key].sort((left, right) => left.stationNo - right.stationNo);
        }

        return byType;
    }, [workstations]);

    const handleDelete = async (id: string) => {
        const result = await deleteWorkstation(id);
        if (!result.success) {
            notify.error(result.error || "Failed to delete workstation");
        } else {
            notify.success("Workstation deleted");
            onWorkstationDeleted?.(id);
            setIsDeleteDialogOpen(false);
            setPendingDeleteId(null);
        }
    };

    const openDeleteDialog = (id: string) => {
        setPendingDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        await handleDelete(pendingDeleteId);
    };

    const openEditDialog = (station: WorkStation) => {
        setPendingEditStation(station);
        editForm.reset({
            name: station.name,
            queueMode: station.queueMode ?? WorkstationQueueMode.MIXED,
        });
        setIsEditDialogOpen(true);
    };

    const handleEditDialogChange = (open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) {
            setPendingEditStation(null);
            editForm.reset({ name: "", queueMode: WorkstationQueueMode.MIXED });
        }
    };

    const handleSaveEdit = async (values: EditWorkstationValues) => {
        if (!pendingEditStation) return;

        setIsSavingEdit(true);
        const payload: { name: string; queueMode?: string } = { name: values.name.trim() };
        if (pendingEditStation.type === "WINDOW") {
            payload.queueMode = values.queueMode;
        }

        const result = await updateWorkstation(pendingEditStation.id, payload);
        if (!result.success) {
            notify.error(result.error || "Failed to update workstation");
        } else {
            notify.success("Workstation updated");
            if (result.data) {
                onWorkstationUpdated?.(result.data as WorkStation);
            }
            handleEditDialogChange(false);
        }
        setIsSavingEdit(false);
    };

    const openCreateDialog = (type: "CALLER" | "TRIAGE" | "WINDOW") => {
        setCreateType(type);
        setCreateCustomName("");
        setCreateCount(1);
        setIsCreateDialogOpen(true);
    };

    const handleCreateWorkstation = async () => {
        setIsCreating(true);
        const result = await createWorkstation({
            type: createType,
            customName: createCustomName.trim() || undefined,
            count: createCount,
        });

        if (!result.success) {
            notify.error(result.error || "Failed to create workstation");
            setIsCreating(false);
            return;
        }

        const createdStations = Array.isArray(result.data)
            ? (result.data as WorkStation[])
            : result.data
                ? [result.data as WorkStation]
                : [];

        onWorkstationsCreated?.(createdStations);
        notify.success(
            createdStations.length > 1 ? `${createdStations.length} workstations created successfully.` : "Workstation created successfully.",
            { duration: 2000 }
        );
        setIsCreateDialogOpen(false);
        setIsCreating(false);
    };

    const renderWorkstationRow = (ws: WorkStation) => {
        const relevantStationIds = ws.type === "CALLER"
            ? [ws.id, ...(ws.childWorkstations?.map((child) => child.id) ?? [])]
            : [ws.id];
        const assignedNames = relevantStationIds.flatMap((stationId) => assignedNamesByStation.get(stationId) ?? []);
        const assignedCount = relevantStationIds.reduce((sum, stationId) => sum + (assignedCounts.get(stationId) ?? 0), 0);
        const visibleNames = assignedNames.slice(0, 2);
        const remainingCount = Math.max(assignedNames.length - visibleNames.length, 0);
        const callerDepartments = ws.type === "CALLER"
            ? (ws.childWorkstations ?? [])
                .map((child) => child.department?.name)
                .filter((name): name is string => Boolean(name))
            : [];

        return (
            <tr
                key={ws.id}
                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => openEditDialog(ws)}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openEditDialog(ws);
                    }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open workstation settings for ${ws.name}`}
            >
                <td className="px-6 py-4">
                    <span className="text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-500/20 tabular-nums">
                        #{ws.stationNo}
                    </span>
                </td>
                <td className="px-6 py-4">
                    <span className="text-xs font-medium text-muted-foreground">{ws.type}</span>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {ws.type === "WINDOW" ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-left font-bold text-sm tracking-tight text-foreground hover:bg-transparent hover:text-blue-700"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    openEditDialog(ws);
                                }}
                                title="Configure window"
                            >
                                {ws.name}
                            </Button>
                        ) : (
                            <span className="text-sm font-bold tracking-tight text-foreground">{ws.name}</span>
                        )}
                        {ws.department && (
                            <span className="ml-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                {ws.department.name}
                            </span>
                        )}
                        {ws.type === "CALLER" && callerDepartments.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {callerDepartments.slice(0, 3).map((departmentName) => (
                                    <span key={`${ws.id}-${departmentName}`} className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {departmentName}
                                    </span>
                                ))}
                                {callerDepartments.length > 3 && (
                                    <span className="text-[11px] text-muted-foreground">+{callerDepartments.length - 3} more</span>
                                )}
                            </div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4">
                    {ws.type === "WINDOW" ? (
                        <span className="text-xs font-medium text-muted-foreground">
                            {(ws.queueMode ?? WorkstationQueueMode.MIXED) === WorkstationQueueMode.PRIORITY_ONLY
                                ? "Priority Only"
                                : (ws.queueMode ?? WorkstationQueueMode.MIXED) === WorkstationQueueMode.REGULAR_ONLY
                                    ? "Regular Only"
                                    : "Mixed"}
                        </span>
                    ) : (
                        <span className="text-xs font-medium text-slate-400 italic">N/A</span>
                    )}
                </td>
                <td className="px-6 py-4">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">
                            {assignedCount} user(s)
                        </span>
                        {(ws.type === "WINDOW" || ws.type === "CALLER") && (
                            <div className="text-xs text-foreground/80 leading-5">
                                {visibleNames.length > 0 ? visibleNames.join(", ") : "No assigned user"}
                                {remainingCount > 0 && (
                                    <p className="text-[11px] text-muted-foreground">+{remainingCount} more</p>
                                )}
                            </div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                openEditDialog(ws);
                            }}
                            className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-all rounded-md"
                            title="Edit Workstation Name"
                        >
                            <PencilSimple size={16} weight="bold" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(event) => {
                                event.stopPropagation();
                                openDeleteDialog(ws.id);
                            }}
                            className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-all rounded-md"
                            title="Delete Workstation"
                        >
                            <Trash size={16} weight="bold" />
                        </Button>
                    </div>
                </td>
            </tr>
        );
    };

    const renderSection = (type: "CALLER" | "TRIAGE" | "WINDOW", label: string) => {
        const rows = groupedWorkstations[type];

        return (
            <>
                <tr className="bg-muted/20 border-y border-border">
                    <td colSpan={6} className="px-6 py-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{rows.length} station(s)</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-7 px-2.5 text-[11px]"
                                    onClick={() => openCreateDialog(type)}
                                >
                                    + Add
                                </Button>
                            </div>
                        </div>
                    </td>
                </tr>
                {rows.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-6 text-sm text-muted-foreground italic">
                            No {label.toLowerCase()} configured.
                        </td>
                    </tr>
                ) : (
                    rows.map(renderWorkstationRow)
                )}
            </>
        );
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-foreground">Operational Workstations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-6 py-4 text-xs font-medium text-muted-foreground w-24">No</th>
                                <th className="px-6 py-4 text-xs font-medium text-muted-foreground w-1/3">Type</th>
                                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Station Name</th>
                                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Queue Lane</th>
                                <th className="px-6 py-4 text-xs font-medium text-muted-foreground">Assigned</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {workstations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-sm font-medium text-muted-foreground">No workstations found. Create your first station from the left panel.</p>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {renderSection("CALLER", "Caller Workstations")}
                                    {renderSection("TRIAGE", "Triage Workstations")}
                                    {renderSection("WINDOW", "Window Workstations")}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{pendingEditStation?.type === "WINDOW" ? "Configure Window" : "Edit Workstation Name"}</DialogTitle>
                        <DialogDescription>
                            {pendingEditStation?.type === "WINDOW"
                                ? "Update the window name and queue-lane behavior here."
                                : "Update the visible label for this station. Keep names concise and recognizable."}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Station Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                autoFocus
                                                placeholder="Enter station name"
                                                disabled={isSavingEdit}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {pendingEditStation?.type === "WINDOW" && (
                                <FormField
                                    control={editForm.control}
                                    name="queueMode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Window Queue Lane</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select queue lane" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={WorkstationQueueMode.MIXED}>Mixed (Priority then Regular)</SelectItem>
                                                    <SelectItem value={WorkstationQueueMode.PRIORITY_ONLY}>Priority Only</SelectItem>
                                                    <SelectItem value={WorkstationQueueMode.REGULAR_ONLY}>Regular Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)} disabled={isSavingEdit}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSavingEdit}>
                                    {isSavingEdit ? "Saving..." : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add {createType === "WINDOW" ? "Window" : createType === "TRIAGE" ? "Triage" : "Caller"} Workstation</DialogTitle>
                        <DialogDescription>
                            Create workstation entries directly inside this section for faster management.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Custom Name (optional)</Label>
                            <Input
                                value={createCustomName}
                                onChange={(event) => setCreateCustomName(event.target.value)}
                                placeholder={createType === "WINDOW" ? "Window name" : createType === "TRIAGE" ? "Triage station name" : "Caller station name"}
                                disabled={isCreating}
                            />
                        </div>

                        {createType === "CALLER" && (
                            <p className="text-xs text-muted-foreground leading-6">
                                Caller workstations are now reusable parent lanes. Department-specific child stations will be created automatically when you assign a clinic caller to a department.
                            </p>
                        )}

                        <div className="space-y-2">
                            <Label>Bulk Qty</Label>
                            <Select
                                value={String(createCount)}
                                onValueChange={(value) => setCreateCount(Number(value))}
                                disabled={isCreating}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5, 10].map((count) => (
                                        <SelectItem key={count} value={String(count)}>{count}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleCreateWorkstation} disabled={isCreating}>
                            {isCreating ? "Creating..." : "Create Workstation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Workstation</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone and will permanently remove the workstation.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
