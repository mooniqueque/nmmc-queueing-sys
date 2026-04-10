"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { notify } from "@/shared/lib/notify";
import { Department, WorkStation, WorkstationType } from "@/shared/types/models";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { createWorkstation } from "../workstation-actions";

interface AddWorkstationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workstations: WorkStation[];
    departments: Department[];
    type: WorkstationType;
    onWorkstationCreated?: (workstation: WorkStation) => void;
}

export function AddWorkstationDialog({
    open,
    onOpenChange,
    workstations,
    departments,
    type,
    onWorkstationCreated,
}: AddWorkstationDialogProps) {
    const [customName, setCustomName] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const existingCount = workstations.filter(ws => ws.type === type).length;
    const nextNumber = existingCount > 0
        ? Math.max(...workstations.filter(ws => ws.type === type).map(ws => ws.stationNo)) + 1
        : 1;

    const typeLabel = type === WorkstationType.WINDOW ? "Window" : type === WorkstationType.TRIAGE ? "Triage" : "Caller";

    const handleCreate = async () => {
        if (!customName.trim()) {
            notify.error("Please enter a name for the workstation.");
            return;
        }

        setLoading(true);
        try {
            const result = await createWorkstation({
                type,
                customName: customName.trim(),
                departmentId: type === WorkstationType.CALLER && departmentId && departmentId !== "none" ? departmentId : undefined,
                count: 1,
            });

            if (result.success) {
                notify.success("Workstation created successfully!");
                setCustomName("");
                setDepartmentId("");
                onOpenChange(false);
                // Trigger callback if provided
                if (onWorkstationCreated && result.data) {
                    onWorkstationCreated(result.data);
                }
            } else {
                notify.error(result.error || "Failed to create workstation.");
            }
        } catch (error) {
            notify.error("An error occurred while creating the workstation.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setCustomName("");
            setDepartmentId("");
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add {typeLabel} Workstation</DialogTitle>
                    <DialogDescription>
                        Create a new {typeLabel.toLowerCase()} workstation instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-muted/30 border border-dashed rounded-lg px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Next Auto Number</p>
                        <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {typeLabel} {nextNumber}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
                        <Input
                            id="name"
                            placeholder={`e.g., ${typeLabel} 1, Main Desk, etc.`}
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {type === WorkstationType.CALLER && (
                        <div className="space-y-2">
                            <Label htmlFor="dept" className="text-sm font-semibold">Linked Department (Optional)</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId} disabled={loading}>
                                <SelectTrigger id="dept" className="bg-background">
                                    <SelectValue placeholder="Select a department..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Department Link</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !customName.trim()}
                        className="gap-2"
                    >
                        <Plus size={16} />
                        {loading ? "Creating..." : "Create Workstation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
