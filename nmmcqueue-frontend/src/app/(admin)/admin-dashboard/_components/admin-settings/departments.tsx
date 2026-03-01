"use client";

import { createDepartment, deleteDepartment } from "@/app/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from "@/types/models";
import { Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { createQueueOption, deleteQueueOption } from "../../_actions/queue-option-actions";

const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"] as const;

type QueueOptionsByDepartment = Record<string, string[]>;

type DepartmentSettingsProps = {
    initialDepartments: Department[];
    initialQueueOptionsByDepartment: QueueOptionsByDepartment;
};

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

function orderOptions(values: string[]) {
    const unique = Array.from(
        new Set(
            values
                .map((value) => value.trim().toUpperCase())
                .filter((value) => value.length > 0)
        )
    );
    const defaultsInOrder = DEFAULT_QUEUE_OPTIONS.filter((option) => unique.includes(option));
    const defaultSet = new Set<string>(DEFAULT_QUEUE_OPTIONS);
    const custom = unique
        .filter((option) => !defaultSet.has(option))
        .sort((left, right) => left.localeCompare(right));

    return [...defaultsInOrder, ...custom];
}

export default function DepartmentSettings({
    initialDepartments,
    initialQueueOptionsByDepartment
}: DepartmentSettingsProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [queueOptionInput, setQueueOptionInput] = useState("");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDepartments[0]?.id ?? "");
    const [queueOptionsByDepartment, setQueueOptionsByDepartment] = useState(initialQueueOptionsByDepartment);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState("");

    const selectedDepartment = initialDepartments.find((department) => department.id === selectedDepartmentId);
    const selectedDepartmentKey = selectedDepartment ? normalizeDepartmentKey(selectedDepartment.name) : "";
    const queueOptions = selectedDepartment
        ? (queueOptionsByDepartment[selectedDepartmentKey] ?? DEFAULT_QUEUE_OPTIONS)
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

        setQueueLoading(true);
        setQueueError("");

        const normalized = queueOptionInput.trim().toUpperCase();
        const result = await createQueueOption(selectedDepartment.name, normalized);

        if (!result.success) {
            setQueueError(result.error || "Failed to add queue option.");
            setQueueLoading(false);
            return;
        }

        const next = orderOptions([...queueOptions, normalized]);
        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: next
        }));

        setQueueOptionInput("");
        setQueueLoading(false);
    };

    const handleDeleteQueueOption = async (option: string) => {
        if (!selectedDepartment) {
            setQueueError("Select a department first.");
            return;
        }

        setQueueLoading(true);
        setQueueError("");

        const result = await deleteQueueOption(selectedDepartment.name, option);
        if (!result.success) {
            setQueueError(result.error || "Failed to remove queue option.");
            setQueueLoading(false);
            return;
        }

        const next = queueOptions.filter((item) => item !== option);
        setQueueOptionsByDepartment((prev) => ({
            ...prev,
            [selectedDepartmentKey]: next
        }));
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
        <div className="space-y-6">
            {/* TOP SECTION - Department & Queue Options Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add New Department Card */}
                <Card className="border-t-4 border-t-emerald-600 shadow-md bg-white">
                    <CardHeader className="bg-emerald-50/70 pb-4 border-b border-emerald-100">
                        <CardTitle className="text-xl font-extrabold text-emerald-900 tracking-tight">Add New Department</CardTitle>
                        <CardDescription className="text-emerald-700/80 font-medium">Create a new clinic or hospital branch.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="space-y-2 relative">
                                <Label htmlFor="name" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Department Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Dental Clinic"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="border-slate-300 focus-visible:ring-emerald-500 font-medium text-slate-800"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="code" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Department Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. DEN (max 5 chars)"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    maxLength={5}
                                    className="border-slate-300 focus-visible:ring-emerald-500 uppercase font-mono tracking-widest font-bold text-slate-800"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-red-600 text-sm font-bold">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-md transition-all active:scale-[0.98]" disabled={loading}>
                                {loading ? "Saving..." : "Save Department"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Queue Options Card */}
                <Card className="border-t-4 border-t-emerald-600 shadow-md bg-white">
                    <CardHeader className="bg-emerald-50/70 pb-4 border-b border-emerald-100">
                        <CardTitle className="text-xl font-extrabold text-emerald-900 tracking-tight">Queue Options</CardTitle>
                        <CardDescription className="text-emerald-700/80 font-medium">Manage caller button options per department.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="queue-department" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Department</Label>
                            <select
                                id="queue-department"
                                value={selectedDepartmentId}
                                onChange={(event) => {
                                    setSelectedDepartmentId(event.target.value);
                                    setQueueError("");
                                }}
                                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800"
                            >
                                {initialDepartments.map((department) => (
                                    <option key={department.id} value={department.id}>
                                        {department.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <Input
                                id="queue-option"
                                placeholder="e.g. PRIORITY"
                                value={queueOptionInput}
                                onChange={(e) => setQueueOptionInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddQueueOption();
                                    }
                                }}
                                className="border-slate-300 focus-visible:ring-emerald-500 uppercase font-bold text-slate-800"
                            />
                            <Button type="button" variant="outline" onClick={handleAddQueueOption} className="font-bold border-slate-300" disabled={queueLoading || !selectedDepartment}>
                                Add
                            </Button>
                        </div>

                        {queueError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm font-bold">{queueError}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 min-h-8">
                            {queueOptions.length === 0 ? (
                                <span className="text-xs text-slate-500">No queue options for this department.</span>
                            ) : (
                                queueOptions.map((option) => (
                                    <div key={option} className="flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded text-xs">
                                        <span>{option}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteQueueOption(option)}
                                            className="text-slate-500 hover:text-red-600"
                                            aria-label={`Remove ${option}`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* BOTTOM SECTION - Active Departments Table */}
            <div>
                <Card className="shadow-md bg-white border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-xl font-bold text-slate-800">Active Departments</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Manage existing clinics and routing codes.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200 bg-slate-50">
                                        <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest w-24">Code</th>
                                        <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest">Department Name</th>
                                        <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-widest text-right w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {initialDepartments.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                                        <span className="text-emerald-500 font-bold text-xl">?</span>
                                                    </div>
                                                    <span className="text-slate-500 font-medium">No departments found. Create your first one on the left.</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        initialDepartments.map((dept) => (
                                            <tr key={dept.id} className="hover:bg-emerald-50/50 transition-colors group">
                                                <td className="p-4">
                                                    <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-1 rounded shadow-sm text-sm">
                                                        {dept.code}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-semibold text-slate-700">{dept.name}</td>
                                                <td className="p-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(dept.id)}
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
        </div>
    );
}
