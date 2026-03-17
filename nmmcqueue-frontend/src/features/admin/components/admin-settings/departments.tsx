"use client";

import { createDepartment, deleteDepartment } from "@/features/admin/department-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from "@/types/models";
import { Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { createQueueOption, deleteQueueOption } from "../../queue-option-actions";


import { PriorityCategory } from "@/types/models";

type QueueOptionsByDepartment = Record<string, PriorityCategory[]>;

type DepartmentSettingsProps = {
    initialDepartments: Department[];
    initialQueueOptionsByDepartment: QueueOptionsByDepartment;
};

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}


export default function DepartmentSettings({
    initialDepartments,
    initialQueueOptionsByDepartment
}: DepartmentSettingsProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [queueNameInput, setQueueNameInput] = useState("");
    const [queueCodeInput, setQueueCodeInput] = useState("");
    const [isPriorityInput, setIsPriorityInput] = useState(false);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0]?.id ?? "");
    const [queueOptionsByDepartment, setQueueOptionsByDepartment] = useState(initialQueueOptionsByDepartment);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState("");

    const selectedDepartment = initialDepartments.find((department) => department.id === selectedDepartmentId);
    const selectedDepartmentKey = selectedDepartment ? normalizeDepartmentKey(selectedDepartment.name) : "";
    const categories = selectedDepartment
        ? (queueOptionsByDepartment[selectedDepartmentKey] ?? [])
        : [];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await createDepartment(name, code);

        if (result.success) {
            setName("");
            setCode("");
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
            isPriority: isPriorityInput
        });

        if (!result.success) {
            setQueueError(result.error || "Failed to add queue option.");
            setQueueLoading(false);
            return;
        }

        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: [...(prev[selectedDepartmentKey] ?? []), result.data]
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
                [selectedDepartmentKey]: prev[selectedDepartmentKey].filter((opt) => opt.id !== id),
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
            alert(result.error || "Failed to delete department");
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add New Department Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Add Department</CardTitle>
                        <CardDescription>Create a new clinic or hospital branch.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <form onSubmit={handleCreate} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Department Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Dental Clinic"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Department Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. DEN"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    maxLength={5}
                                    className="h-11 font-mono uppercase tracking-widest"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                                    <p className="text-destructive text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full h-11 font-bold uppercase tracking-widest text-xs" disabled={loading}>
                                {loading ? "Saving..." : "Save Department"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Queue Options Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Queue Options</CardTitle>
                        <CardDescription>Manage caller button options per department.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="queue-department" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Select Department</Label>
                            <select
                                id="queue-department"
                                value={selectedDepartmentId}
                                onChange={(event) => {
                                    setSelectedDepartmentId(event.target.value);
                                    setQueueError("");
                                }}
                                className="w-full h-11 rounded-lg border bg-background px-3 text-sm font-semibold transition-all focus:ring-2 focus:ring-primary/20"
                            >
                                {initialDepartments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-muted/30">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Option Name</Label>
                                    <Input
                                        placeholder="e.g. Fasting"
                                        value={queueNameInput}
                                        onChange={(e) => setQueueNameInput(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Option Code</Label>
                                    <Input
                                        placeholder="e.g. FAST"
                                        value={queueCodeInput}
                                        onChange={(e) => setQueueCodeInput(e.target.value)}
                                        className="h-10 uppercase font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-muted/20">
                                <input 
                                    type="checkbox" 
                                    id="isPriority" 
                                    checked={isPriorityInput} 
                                    onChange={(e) => setIsPriorityInput(e.target.checked)}
                                    className="w-4 h-4 rounded border-muted focus:ring-primary text-primary"
                                />
                                <Label htmlFor="isPriority" className="text-xs font-bold opacity-70">Mark as Priority Class</Label>
                            </div>
                            <Button type="button" onClick={handleAddQueueOption} variant="secondary" className="w-full h-10 font-bold uppercase tracking-widest text-[10px]" disabled={queueLoading || !selectedDepartment}>
                                {queueLoading ? "Adding..." : "Add Category"}
                            </Button>
                        </div>

                        {queueError && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                                <p className="text-destructive text-xs font-bold">{queueError}</p>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar pt-2">
                            {categories.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground uppercase font-bold text-center py-4 bg-muted/10 rounded-xl border border-dashed">No categories defined</p>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black tracking-tight">{cat.name}</span>
                                            <span className="text-[9px] font-black uppercase text-muted-foreground bg-background px-1.5 py-0.5 rounded border">{cat.code}</span>
                                            {cat.isPriority && (
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ring-1 ring-primary/20">Priority</span>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteQueueOption(cat.id)}
                                            className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash size={14} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Departments Table */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Active Departments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Code</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Department Name</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {initialDepartments.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-20 text-center">
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No departments found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    initialDepartments.map((dept) => (
                                        <tr key={dept.id} className="group hover:bg-accent/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/10 tabular-nums">
                                                    {dept.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold tracking-tight">{dept.name}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(dept.id)}
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
