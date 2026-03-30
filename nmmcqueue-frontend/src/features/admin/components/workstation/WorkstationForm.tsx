"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkStation, Department, WorkstationType } from "@/types/models";
import { createWorkstation } from "@/features/admin/workstation-actions";

type WorkstationFormProps = {
    workstations: WorkStation[];
    departments: Department[];
};

export function WorkstationForm({ workstations, departments }: WorkstationFormProps) {
    const [type, setType] = useState<WorkstationType>(WorkstationType.WINDOW);
    const [customName, setCustomName] = useState("");
    const [departmentId, setDepartmentId] = useState<string>("");
    const [count, setCount] = useState<number>(1);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Calculate existing count for the selected type
    const existingCount = workstations.filter(ws => ws.type === type).length;
    const nextNumber = existingCount > 0 
        ? Math.max(...workstations.filter(ws => ws.type === type).map(ws => ws.stationNo)) + 1 
        : 1;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await createWorkstation({
            type,
            customName: customName.trim() || undefined,
            departmentId: departmentId && departmentId !== "none" ? departmentId : undefined,
            count
        });

        if (result.success) {
            setCustomName("");
            setCount(1);
        } else {
            setError(result.error || "Failed to create workstation");
        }
        setLoading(false);
    };

    // Helper formatting
    const typeLabel = type === WorkstationType.WINDOW ? "Window" : type === WorkstationType.TRIAGE ? "Triage" : "Caller";

    return (
        <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Add Workstation</CardTitle>
                <CardDescription className="text-xs">Define a physical service point or triage desk automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <form onSubmit={handleCreate} className="space-y-6 max-w-md">
                    
                    {/* Primary Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workstation Type</Label>
                            <Select value={type} onValueChange={(val) => { setType(val as WorkstationType); setCustomName(""); setCount(1); }}>
                                <SelectTrigger className="h-11 bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={WorkstationType.WINDOW}>Window (Registration)</SelectItem>
                                    <SelectItem value={WorkstationType.TRIAGE}>Triage Desk</SelectItem>
                                    <SelectItem value={WorkstationType.CALLER}>Clinic Caller</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Automatic Stats Display */}
                        <div className="bg-muted/30 border border-border rounded-lg px-4 py-2 h-11 flex flex-col justify-center min-w-[140px]">
                            <div className="flex justify-between items-center text-[10px] sm:text-xs">
                                <span className="text-muted-foreground font-medium">Existing: </span>
                                <span className="font-bold text-foreground">{existingCount}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] sm:text-xs mt-0.5">
                                <span className="text-muted-foreground font-medium">Next: </span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{typeLabel} {nextNumber}</span>
                            </div>
                        </div>
                    </div>

                    {/* Department Link (Callers Only) */}
                    {type === WorkstationType.CALLER && (
                        <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-lg">
                            <Label htmlFor="dept" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Linked Department (Optional)</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger className="h-10 bg-background">
                                    <SelectValue placeholder="Generic Caller (All Departments)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Generic Caller (All Departments)</SelectItem>
                                    {departments.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                Tip: For monitor lane routing, include queue option code/name in station name (e.g. REGULAR, PRIORITY, PWD).
                            </p>
                        </div>
                    )}

                    {/* Optional Customization */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Custom Name <span className="lowercase font-normal opacity-70">(optional)</span></Label>
                            <Input
                                id="customName"
                                placeholder={`Leave blank for "${typeLabel} ${nextNumber}"`}
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="h-11 bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="count" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Bulk Qty</Label>
                            <Select value={count.toString()} onValueChange={(val) => setCount(Number(val))}>
                                <SelectTrigger className="h-11 bg-background text-center">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="min-w-[80px]">
                                    {[1, 2, 3, 4, 5, 10].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-xs font-bold">{error}</p>
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all" disabled={loading}>
                        {loading ? "Creating..." : count > 1 ? `+ Add ${count} ${typeLabel}s` : `+ Add ${typeLabel}`}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
