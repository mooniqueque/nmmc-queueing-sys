"use client";

import { createDepartment, deleteDepartment } from "@/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Department } from "@prisma/client";
import { useState } from "react";
import { Trash } from "@phosphor-icons/react";

export default function DepartmentSettings({ initialDepartments }: { initialDepartments: Department[] }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this department?")) return;

        const result = await deleteDepartment(id);
        if (!result.success) {
            alert(result.error || "Failed to delete department");
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* THE FORM PANEL */}
            <div className="xl:col-span-4">
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
            </div>

            {/* THE DATA TABLE PANEL */}
            <div className="xl:col-span-8">
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
