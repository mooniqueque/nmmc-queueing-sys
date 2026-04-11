"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChangeEvent } from "react";
import type { KioskFormValues } from "../schemas";

interface DemographicsStepProps {
    formData: KioskFormValues;
    errors: Partial<Record<keyof KioskFormValues, string>>;
    onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: unknown }
    ) => void;
}

export function DemographicsStep({ formData, errors, onChange }: DemographicsStepProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase">2. Patient Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" className="bg-white" value={formData.lastName} onChange={onChange} />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" className="bg-white" value={formData.firstName} onChange={onChange} />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" className="bg-white" value={formData.middleName} onChange={onChange} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Complete Address *</Label>
                <Input id="address" name="address" className="bg-white" value={formData.address} onChange={onChange} />
                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="contactNo">Mobile / Contact Number</Label>
                <Input
                    id="contactNo"
                    name="contactNo"
                    placeholder="e.g. 09123456789"
                    className="bg-white"
                    value={formData.contactNo || ""}
                    onChange={onChange}
                />
                {errors.contactNo && <p className="text-xs text-red-500">{errors.contactNo}</p>}
            </div>
        </div>
    );
}
