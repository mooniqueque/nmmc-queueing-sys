"use client";

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from 'react';
import { UserPlus } from '@phosphor-icons/react';

import { Department } from "@prisma/client";

/**
 * COMPONENT: AddUserDialog
 * Handles the registration of new staff members.
 * Separates the complex form logic and state from the main dashboard.
 */
export function AddUserDialog({ departments = [] }: { departments?: Department[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        employeeID: '',
        role: '',
        department: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await adminCreateUser(formData);
            if (result.success) {
                setOpen(false);
                setFormData({ name: '', email: '', employeeID: '', role: '', department: '' });
                router.refresh();
            } else {
                alert(result.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-200">
                    <UserPlus size={18} className="mr-2" /> Add Users
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Staff</DialogTitle>
                    <DialogDescription>
                        Register a new hospital staff member. They will be automatically approved.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="Full Name"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                            placeholder="email@nmmc.gov.ph"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="empId" className="text-right">ID</Label>
                        <Input
                            id="empId"
                            value={formData.employeeID}
                            onChange={(e) => setFormData({ ...formData, employeeID: e.target.value })}
                            className="col-span-3"
                            placeholder="Employee ID"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="CLINIC_CALLER">Clinic Caller</SelectItem>
                                    <SelectItem value="WINDOW_CLERK">Window Clerk</SelectItem>
                                    <SelectItem value="TRIAGE_NURSE">Triage Nurse</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dept" className="text-right">Dept</Label>
                        <div className="col-span-3">
                            <Select
                                value={formData.department}
                                onValueChange={(val) => setFormData({ ...formData, department: val })}
                                required
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.length > 0 ? (
                                        departments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>No departments found</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Save User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
