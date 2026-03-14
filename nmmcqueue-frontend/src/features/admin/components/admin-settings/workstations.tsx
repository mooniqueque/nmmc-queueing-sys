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
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add New Workstation Card */}
                <Card className="border-t-4 border-t-emerald-600 shadow-md bg-white">
                    <CardHeader className="bg-emerald-50/70 pb-4 border-b border-emerald-100">
                        <CardTitle className="text-xl font-extrabold text-emerald-900 tracking-tight">Add New Workstation</CardTitle>
                        <CardDescription className="text-emerald-700/80 font-medium">Define a physical service point or triage desk.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Station Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Window 1 or Triage A"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="border-slate-300 focus-visible:ring-emerald-500 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Type</Label>
                                    <Select value={type} onValueChange={(val) => setType(val as WorkstationType)}>
                                        <SelectTrigger className="border-slate-300">
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
                                    <Label htmlFor="no" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Station No</Label>
                                    <Input
                                        id="no"
                                        type="number"
                                        value={stationNo}
                                        onChange={(e) => setStationNo(Number(e.target.value))}
                                        required
                                        className="border-slate-300 focus-visible:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {type === WorkstationType.CALLER && (
                                <div className="space-y-2">
                                    <Label htmlFor="dept" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Linked Department</Label>
                                    <Select value={departmentId} onValueChange={setDepartmentId}>
                                        <SelectTrigger className="border-slate-300">
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
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-red-600 text-sm font-bold">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? "Saving..." : "Save Workstation"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-slate-200 bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Workstation Logic</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4 text-slate-600">
                        <p><strong>WINDOW:</strong> Assigned to Window Clerks for patient registration and ticket issuance.</p>
                        <p><strong>TRIAGE:</strong> Assigned to Triage Nurses for vital signs and patient prioritization.</p>
                        <p><strong>CALLER:</strong> Assigned to Clinic Callers. Can be optionally linked to a specific medical department.</p>
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800">
                            <strong>Note:</strong> Workstation assignments are used to track which physical desk is calling a patient.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Existing Workstations Table */}
            <Card className="shadow-md bg-white border-slate-200 mt-6">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-xl font-bold text-slate-800">Operational Workstations</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">Manage existing physical stations and desks.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-200 bg-slate-50">
                                    <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest w-24">No</th>
                                    <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Station Name</th>
                                    <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Type</th>
                                    <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest text-right w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {initialWorkstations.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-slate-500 font-medium">
                                            No workstations configured.
                                        </td>
                                    </tr>
                                ) : (
                                    initialWorkstations.map((ws) => (
                                        <tr key={ws.id} className="hover:bg-emerald-50/50 transition-colors group">
                                            <td className="p-4">
                                                <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-1 rounded shadow-sm text-sm">
                                                    #{ws.stationNo}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-700">{ws.name}</td>
                                            <td className="p-4 italic text-slate-500">{ws.type}</td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(ws.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                >
                                                    <Trash size={18} className="mr-1" />
                                                    Delete
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
