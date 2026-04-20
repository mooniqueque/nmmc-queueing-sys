"use client";

import { Button } from "@/components/ui/button";
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
import { createWorkstation, deleteWorkstation, updateWorkstation } from "@/features/admin/workstation-actions";
import { notify } from "@/shared/lib/notify";
import type { UserData } from "@/shared/types/auth";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type DepartmentWorkstationListProps = {
    department: Department;
    workstations: WorkStation[];
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
});

type EditWorkstationValues = z.infer<typeof editWorkstationSchema>;

export default function DepartmentWorkstationList({
    department,
    workstations,
    users,
    onWorkstationsCreated,
    onWorkstationUpdated,
    onWorkstationDeleted,
}: DepartmentWorkstationListProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
        },
    });

    const departmentStations = useMemo(() => {
        return workstations
            .filter((station) => station.departmentId === department.id)
            .filter((station) => station.type === WorkstationType.CALLER)
            .sort((a, b) => {
                if (a.stationNo !== b.stationNo) return a.stationNo - b.stationNo;
                return a.id.localeCompare(b.id);
            });
    }, [department.id, workstations]);

    const callerLabelById = useMemo(() => {
        const callers = departmentStations
            .filter((station) => station.type === WorkstationType.CALLER)
            .sort((a, b) => {
                if (a.stationNo !== b.stationNo) return a.stationNo - b.stationNo;
                return a.id.localeCompare(b.id);
            });
        const map = new Map<string, number>();
        callers.forEach((station, index) => map.set(station.id, index + 1));
        return map;
    }, [departmentStations]);

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

    const openCreateDialog = () => {
        setCreateCustomName("");
        setCreateCount(1);
        setIsCreateDialogOpen(true);
    };

    const handleCreate = async () => {
        setIsCreating(true);
        const result = await createWorkstation({
            type: WorkstationType.CALLER,
            customName: createCustomName.trim() || undefined,
            count: createCount,
            departmentId: department.id,
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
            createdStations.length > 1
                ? `${createdStations.length} workstations created.`
                : "Workstation created.",
            { duration: 2000 }
        );

        setIsCreateDialogOpen(false);
        setIsCreating(false);
    };

    const openEditDialog = (station: WorkStation) => {
        setPendingEditStation(station);
        editForm.reset({
            name: station.name,
        });
        setIsEditDialogOpen(true);
    };

    const handleEditDialogChange = (open: boolean) => {
        setIsEditDialogOpen(open);
        if (!open) {
            setPendingEditStation(null);
            editForm.reset({ name: "" });
        }
    };

    const handleSaveEdit = async (values: EditWorkstationValues) => {
        if (!pendingEditStation) return;

        setIsSavingEdit(true);
        const payload: { name: string } = { name: values.name.trim() };

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

    const openDeleteDialog = (id: string) => {
        setPendingDeleteId(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!pendingDeleteId) return;
        const result = await deleteWorkstation(pendingDeleteId);
        if (!result.success) {
            notify.error(result.error || "Failed to delete workstation");
            return;
        }
        notify.success("Workstation deleted");
        onWorkstationDeleted?.(pendingDeleteId);
        setIsDeleteDialogOpen(false);
        setPendingDeleteId(null);
    };

    const getPrimaryLabel = (station: WorkStation) => {
        const index = callerLabelById.get(station.id);
        return index ? `Caller ${index}` : "Caller";
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
                <div>
                    <p className="text-sm font-semibold">Caller Stations</p>
                    <p className="text-xs text-muted-foreground">
                        Manage caller stations for {department.name}. Caller numbers are department-local labels.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={openCreateDialog}>
                        <Plus size={14} className="mr-2" /> Add Caller Station
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="min-w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Station</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Assigned</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departmentStations.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    No caller stations configured for this department.
                                </td>
                            </tr>
                        ) : (
                            departmentStations.map((station) => {
                                const assigned = assignedNamesByStation.get(station.id) ?? [];
                                const primary = getPrimaryLabel(station);
                                const secondary = station.name;

                                return (
                                    <tr key={station.id} className="border-t">
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">{primary}</span>
                                                {secondary ? (
                                                    <span className="text-xs text-muted-foreground">{secondary}</span>
                                                ) : null}
                                            </div>
                                        </td>
                                        
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {assigned.length === 0 ? "No assigned user" : assigned.slice(0, 2).join(", ")}
                                                {assigned.length > 2 ? ` (+${assigned.length - 2} more)` : ""}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(station)}
                                                >
                                                    <PencilSimple size={14} className="mr-2" /> Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(station.id)}
                                                >
                                                    <Trash size={14} className="mr-2" /> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create caller station</DialogTitle>
                        <DialogDescription>
                            This creates caller stations inside {department.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Custom name (optional)</Label>
                                <Input
                                    value={createCustomName}
                                    onChange={(event) => setCreateCustomName(event.target.value)}
                                    placeholder="e.g., Caller - ANIM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Count</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={createCount}
                                    onChange={(event) => setCreateCount(Math.max(1, Math.min(20, Number(event.target.value || 1))))}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit caller station</DialogTitle>
                        <DialogDescription>
                            Update the station name.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSavingEdit}>
                                    {isSavingEdit ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete caller station</DialogTitle>
                        <DialogDescription>
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
