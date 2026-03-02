"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { TriageFormValues } from "../_schemas/triage-schema";

interface DemographicsSectionProps {
    isManualEntry: boolean;
    hasSelectedPatient: boolean;
}

export function DemographicsSection({ isManualEntry, hasSelectedPatient }: DemographicsSectionProps) {
    const { register, control, formState: { errors } } = useFormContext<TriageFormValues>();
    const watchDob = useWatch({ control, name: "dateOfBirth" });

    const calculateAge = (dobString: string | Date | undefined) => {
        if (!dobString) return "";
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return "";
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age >= 0 ? age : "";
    };

    const disabled = !isManualEntry && hasSelectedPatient;

    return (
        <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-slate-700 uppercase">Patient Demographics</h3>
                <Controller
                    control={control}
                    name="hasAppointment"
                    render={({ field }) => (
                        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-md border text-sm font-semibold text-slate-700">
                            <Switch
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                                disabled={disabled}
                            />
                            <Label className="cursor-pointer">Has Appointment</Label>
                        </div>
                    )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input className="bg-white" disabled={disabled} {...register("lastName")} />
                    {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input className="bg-white" disabled={disabled} {...register("firstName")} />
                    {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label>Middle Name</Label>
                    <Input className="bg-white" disabled={disabled} {...register("middleName")} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Complete Address *</Label>
                <Input className="bg-white" disabled={disabled} {...register("address")} />
                {errors.address && <span className="text-red-500 text-xs">{errors.address.message}</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label>Date of Birth *</Label>
                    <Input type="date" className="bg-white" disabled={disabled} {...register("dateOfBirth")} />
                    {errors.dateOfBirth && <span className="text-red-500 text-xs">{errors.dateOfBirth.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label>Age</Label>
                    <Input value={calculateAge(watchDob)} disabled className="bg-slate-100 font-medium text-slate-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label>Birthplace *</Label>
                    <Input className="bg-white" disabled={disabled} {...register("birthPlace")} />
                    {errors.birthPlace && <span className="text-red-500 text-xs">{errors.birthPlace.message}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.gender && <span className="text-red-500 text-xs">{errors.gender.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label>Civil Status *</Label>
                    <Controller
                        control={control}
                        name="civilStatus"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Single">Single</SelectItem>
                                    <SelectItem value="Married">Married</SelectItem>
                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                    <SelectItem value="Separated">Separated</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.civilStatus && <span className="text-red-500 text-xs">{errors.civilStatus.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label>Religion *</Label>
                    <Input className="bg-white" disabled={disabled} {...register("religion")} />
                    {errors.religion && <span className="text-red-500 text-xs">{errors.religion.message}</span>}
                </div>
            </div>
        </div>
    );
}
