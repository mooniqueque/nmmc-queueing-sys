"use client";

import { createWorkstation, deleteWorkstation } from "@/features/admin/workstation-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkStation, Department, WorkstationType } from "@/types/models";
import { Trash } from "@phosphor-icons/react";
import { useState } from "react";

type WorkstationSettingsProps = {
    initialWorkstations: WorkStation[];
    departments: Department[];
};

export default function WorkstationSettings({
    initialWorkstations,
    departments
}: WorkstationSettingsProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<WorkstationType>(WorkstationType.WINDOW);
    const [stationNo, setStationNo] = useState<number>(1);
    const [departmentId, setDepartmentId] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await createWorkstation({
            name,
            type,
            stationNo: Number(stationNo),
            departmentId: departmentId || undefined
        });

        if (result.success) {
            setName("");
            setStationNo(prev => prev + 1);
        } else {
            setError(result.error || "Failed to create workstation");
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this workstation?")) return;
        const result = await deleteWorkstation(id);
        if (!result.success) {
            alert(result.error || "Failed to delete workstation");
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add New Workstation Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Add Workstation</CardTitle>
                        <CardDescription>Define a physical service point or triage desk.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Station Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Window 1 or Triage A"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Type</Label>
                                    <Select value={type} onValueChange={(val) => setType(val as WorkstationType)}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={WorkstationType.WINDOW}>Window (Registration)</SelectItem>
                                            <SelectItem value={WorkstationType.TRIAGE}>Triage Desk</SelectItem>
                                            <SelectItem value={WorkstationType.CALLER}>Clinic Caller</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="no" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Station No</Label>
                                    <Input
                                        id="no"
                                        type="number"
                                        value={stationNo}
                                        onChange={(e) => setStationNo(Number(e.target.value))}
                                        required
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            {type === WorkstationType.CALLER && (
                                <div className="space-y-2">
                                    <Label htmlFor="dept" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Linked Department</Label>
                                    <Select value={departmentId} onValueChange={setDepartmentId}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Optional: Generic</SelectItem>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                                    <p className="text-destructive text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest text-xs" disabled={loading}>
                                {loading ? "Saving..." : "Save Workstation"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Workstation Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-2">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Window</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Assigned to Window Clerks for patient registration and ticket issuance.</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Triage</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Assigned to Triage Nurses for vital signs and patient prioritization.</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Caller</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">Assigned to Clinic Callers. Can be optionally linked to a specific medical department.</p>
                            </div>
                        </div>
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <p className="text-xs font-semibold text-primary leading-relaxed italic">
                                Note: Workstation assignments are used to track which physical desk is calling a patient.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Existing Workstations Table */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Operational Workstations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">No</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Station Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Type</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {initialWorkstations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No workstations found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    initialWorkstations.map((ws) => (
                                        <tr key={ws.id} className="group hover:bg-accent/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/10 tabular-nums">
                                                    #{ws.stationNo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold tracking-tight">{ws.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{ws.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(ws.id)}
                                                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
