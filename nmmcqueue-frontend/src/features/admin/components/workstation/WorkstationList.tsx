"use client";

import { WorkStation } from "@/shared/types/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteWorkstation, updateWorkstation } from "@/features/admin/workstation-actions";
import { notify } from "@/shared/lib/notify";
import { Trash, PencilSimple, Check, X } from "@phosphor-icons/react";
import { useState } from "react";

type WorkstationListProps = {
    workstations: WorkStation[];
};

export function WorkstationList({ workstations }: WorkstationListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        const result = await deleteWorkstation(id);
        if (!result.success) {
            notify.error(result.error || "Failed to delete workstation");
        } else {
            notify.success("Workstation deleted");
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

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) return notify.error("Name cannot be empty");
        setIsSaving(true);
        const result = await updateWorkstation(id, { name: editName.trim() });
        if (!result.success) {
            notify.error(result.error || "Failed to update workstation");
        } else {
            notify.success("Workstation updated");
            setEditingId(null);
        }
        setIsSaving(false);
    };

    const startEdit = (ws: WorkStation) => {
        setEditingId(ws.id);
        setEditName(ws.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Operational Workstations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-24">No</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-1/3">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Station Name</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {workstations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No workstations found</p>
                                    </td>
                                </tr>
                            ) : (
                                workstations.map((ws) => (
                                    <tr key={ws.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-500/20 tabular-nums">
                                                #{ws.stationNo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">{ws.type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === ws.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 w-full max-w-62.5 rounded-md border bg-background px-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveEdit(ws.id);
                                                            if (e.key === 'Escape') cancelEdit();
                                                        }}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-bold tracking-tight text-foreground">{ws.name}</span>
                                                    {ws.department && (
                                                        <span className="ml-3 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            {ws.department.name}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingId === ws.id ? (
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(ws.id)}
                                                        disabled={isSaving}
                                                        className="size-8 text-emerald-600 hover:bg-emerald-500/10 transition-all rounded-md"
                                                        title="Save"
                                                    >
                                                        <Check size={16} weight="bold" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={cancelEdit}
                                                        disabled={isSaving}
                                                        className="size-8 text-slate-500 hover:bg-slate-500/10 transition-all rounded-md"
                                                        title="Cancel"
                                                    >
                                                        <X size={16} weight="bold" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEdit(ws)}
                                                        className="size-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-all rounded-md"
                                                        title="Edit Workstation Name"
                                                    >
                                                        <PencilSimple size={16} weight="bold" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(ws.id)}
                                                        className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-all rounded-md"
                                                        title="Delete Workstation"
                                                    >
                                                        <Trash size={16} weight="bold" />
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

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
