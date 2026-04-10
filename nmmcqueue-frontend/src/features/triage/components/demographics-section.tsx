"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { calculateAge } from "@/shared/lib/utils";
import { CalendarBlank, IdentificationBadge, MapPin, UserCircle } from "@phosphor-icons/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { TriageFormInput } from "../schemas";
import { useTriageStore } from "../store/use-triage-store";

export function DemographicsSection() {
    const { register, control, formState: { errors } } = useFormContext<TriageFormInput>();
    const watchDob = useWatch({ control, name: "dateOfBirth" });
    const { selectedPatient } = useTriageStore();

    const todayString = new Date().toISOString().split('T')[0];

    // Demographics are always editable so the nurse can update outdated or incorrect info
    const disabled = false;

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm transition-all mb-8">
            <div className="flex justify-between items-center bg-card -mt-6 -mx-6 px-6 py-4 rounded-t-xl border-b border-border shadow-sm mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-widest uppercase text-muted-foreground">
                        <IdentificationBadge size={20} className="text-primary" weight="bold" />
                        Patient Demographics
                    </h3>
                    
                </div>

                <Controller
                    control={control}
                    name="hasAppointment"
                    render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-background px-3 py-1.5 rounded-lg border border-border text-[10px] font-bold text-foreground transition-all hover:border-primary/30">
                            <Switch
                                id="has-appt"
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                                disabled={disabled}
                                className="data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="has-appt" className="text-base font-bold text-gray-800 cursor-pointer uppercase tracking-wide">Has Appointment</Label>
                        </div>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Last Name *</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Dela Cruz"
                            {...register("lastName")}
                        />
                        {errors.lastName && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.lastName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">First Name *</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Juan"
                            {...register("firstName")}
                        />
                        {errors.firstName && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.firstName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Middle Name</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Santos"
                            {...register("middleName")}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                    <MapPin size={14} weight="bold" /> Complete Address *
                </Label>
                <div className="relative">
                    <Input
                        className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50"
                        disabled={disabled}
                        placeholder="House No, Street, Barangay, City, Province"
                        {...register("address")}
                    />
                    {errors.address && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.address.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                        <CalendarBlank size={14} weight="bold" /> Date of Birth *
                    </Label>
                    <Input
                        type="date"
                        max={todayString}
                        min="1900-01-01"
                        className={`h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 ${
                            (watchDob && calculateAge(watchDob) === null) ? 'border-destructive focus:border-destructive' : 'focus:border-primary/50'
                        }`}
                        disabled={disabled}
                        {...register("dateOfBirth")}
                    />
                    {errors.dateOfBirth ? (
                        <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.dateOfBirth.message}</span>
                    ) : (watchDob && calculateAge(watchDob) === null) ? (
                        <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">Please provide a valid birth date</span>
                    ) : null}
                </div>
                <div className="space-y-2">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Age</Label>
                    <Input
                        value={calculateAge(watchDob) !== null ? `${calculateAge(watchDob)} years` : ''}
                        disabled
                        placeholder="Calculated automatically"
                        className={`h-10 rounded-lg border-border bg-muted/50 px-4 text-lg font-semibold ${
                            (watchDob && calculateAge(watchDob) === null) ? 'text-destructive/70' : 'text-gray-900'
                        }`}
                    />
                    {(watchDob && calculateAge(watchDob) === null) && (
                        <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">Invalid Age</span>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2 relative">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Birthplace *</Label>
                    <Input
                        className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50"
                        disabled={disabled}
                        placeholder="Cagayan de Oro City"
                        {...register("birthPlace")}
                    />
                    {errors.birthPlace && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.birthPlace.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                        <UserCircle size={14} weight="bold" /> Gender *
                    </Label>
                    <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50">
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border bg-background">
                                    <SelectItem value="Male" className="text-sm font-semibold py-2">Male</SelectItem>
                                    <SelectItem value="Female" className="text-sm font-semibold py-2">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.gender && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.gender.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Civil Status *</Label>
                    <Controller
                        control={control}
                        name="civilStatus"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50">
                                    <SelectValue placeholder="Select Civil Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border bg-background">
                                    <SelectItem value="Single" className="text-sm font-semibold py-2">Single</SelectItem>
                                    <SelectItem value="Married" className="text-sm font-semibold py-2">Married</SelectItem>
                                    <SelectItem value="Widowed" className="text-sm font-semibold py-2">Widowed</SelectItem>
                                    <SelectItem value="Divorced" className="text-sm font-semibold py-2">Divorced</SelectItem>
                                    <SelectItem value="Separated" className="text-sm font-semibold py-2">Separated</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.civilStatus && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.civilStatus.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1">Religion *</Label>
                    <Controller
                        control={control}
                        name="religion"
                        render={({ field }) => (
                            <SearchableSelect
                                options={[
                                    "Roman Catholic",
                                    "Islam",
                                    "Protestantism",
                                    "Iglesia ni Cristo (INC)",
                                    "Philippine Independent Church (Aglipayan)",
                                    "Seventh-day Adventist Church",
                                    "Members Church of God International (Ang Dating Daan)",
                                    "Jesus Miracle Crusade",
                                    "Church of Jesus Christ of Latter-day Saints (Mormons)",
                                    "Jehovah's Witnesses",
                                    "Others"
                                ].map(rel => ({ label: rel, value: rel }))}
                                value={field.value as string}
                                onSelect={field.onChange}
                                placeholder="Select Religion"
                                searchPlaceholder="Search religion..."
                                emptyMessage="No religion found."
                                className="h-10 text-lg font-semibold text-gray-900"
                                disabled={disabled}
                            />
                        )}
                    />
                    {errors.religion && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.religion.message}</span>}
                </div>
            </div>
        </div>
    );
}
