"use client";

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Department, WorkStation, WorkstationType } from "@/types/models";
import { CaretUpDown, Check, UserPlus } from '@phosphor-icons/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminCreateUser } from '../user-actions';
import { getWorkstations } from '../workstation-actions';

/**
 * COMPONENT: AddUserDialog
 * Handles the registration of new staff members.
 * Separates the complex form logic and state from the main dashboard.
 */
export function AddUserDialog({ departments = [] }: { departments?: Department[] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [openDept, setOpenDept] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        employeeID: '',
        role: '',
        department: '',
        workstationId: ''
    });
    const [allWorkstations, setAllWorkstations] = useState<WorkStation[]>([]);

    useEffect(() => {
        if (open) {
            getWorkstations().then(res => {
                if (res.success) setAllWorkstations(res.data);
            });
        }
    }, [open]);

    const filteredWorkstations = allWorkstations.filter(ws => {
        if (formData.role === "WINDOW_CLERK") return ws.type === WorkstationType.WINDOW;
        if (formData.role === "TRIAGE_NURSE") return ws.type === WorkstationType.TRIAGE;
        if (formData.role === "CLINIC_CALLER") return ws.type === WorkstationType.CALLER;
        return false;
    });

    const isWindowOrTriage = formData.role === "WINDOW_CLERK" || formData.role === "TRIAGE_NURSE";
    const isClinicCaller = formData.role === "CLINIC_CALLER";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await adminCreateUser(formData);
            if (result.success) {
                setOpen(false);
                setFormData({ name: '', email: '', employeeID: '', role: '', department: '', workstationId: '' });
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
                <Button className="gap-2">
                    <UserPlus size={18} />
                    <span>Add Staff</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Staff</DialogTitle>
                    <DialogDescription>
                        Register a new hospital staff member.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</Label>
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
                            <Label htmlFor="email" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
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
                            <Label htmlFor="empId" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</Label>
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
                            <Label htmlFor="role" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
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

                        {/* Workstation Selector */}
                        {(isWindowOrTriage || isClinicCaller) && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ws" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Station</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={formData.workstationId}
                                        onValueChange={(val) => setFormData({ ...formData, workstationId: val })}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={`Select ${formData.role === "WINDOW_CLERK" ? 'Window' : 'Station'}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredWorkstations.map(ws => (
                                                <SelectItem key={ws.id} value={ws.id}>
                                                    {ws.name} ({ws.stationNo})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Department Selector */}
                        {(!isWindowOrTriage) && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dept" className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dept</Label>
                                <div className="col-span-3">
                                    <Popover open={openDept} onOpenChange={setOpenDept}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openDept}
                                                className="w-full justify-between font-normal"
                                            >
                                                <span className="truncate">
                                                    {formData.department
                                                        ? departments.find((dept) => dept.name === formData.department)?.name
                                                        : "Search department..."}
                                                </span>
                                                <CaretUpDown weight="bold" className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0 z-50" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search department..." className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>No department found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {departments.map((dept) => (
                                                            <CommandItem
                                                                key={dept.id}
                                                                value={dept.name}
                                                                onSelect={(currentValue) => {
                                                                    const actualValue = departments.find(
                                                                        (d) => d.name.toLowerCase() === currentValue.toLowerCase()
                                                                    )?.name || currentValue;
                                                                    setFormData({ ...formData, department: actualValue === formData.department ? "" : actualValue });
                                                                    setOpenDept(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.department === dept.name ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {dept.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Save User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
