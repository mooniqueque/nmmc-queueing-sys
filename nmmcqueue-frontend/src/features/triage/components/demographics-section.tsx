"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { CalendarBlank, UserCircle, MapPin, IdentificationBadge } from "@phosphor-icons/react";
import { calculateAge } from "@/lib/utils";

interface DemographicsSectionProps {
    isManualEntry: boolean;
    hasSelectedPatient: boolean;
}

export function DemographicsSection({ isManualEntry, hasSelectedPatient }: DemographicsSectionProps) {
    const { register, control, formState: { errors } } = useFormContext<TriageFormValues>();
    const watchDob = useWatch({ control, name: "dateOfBirth" });

    const todayString = new Date().toISOString().split('T')[0];

    const disabled = !isManualEntry && hasSelectedPatient;

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm transition-all mb-8">
            <div className="flex justify-between items-center bg-card -mt-6 -mx-6 px-6 py-4 rounded-t-xl border-b border-border shadow-sm mb-6">
                <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    <IdentificationBadge size={18} className="text-primary" weight="bold" />
                    Patient Demographics
                </h3>

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
                            <Label htmlFor="has-appt" className="cursor-pointer uppercase tracking-widest">Has Appointment</Label>
                        </div>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Last Name *</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Dela Cruz"
                            {...register("lastName")}
                        />
                        {errors.lastName && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.lastName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">First Name *</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Juan"
                            {...register("firstName")}
                        />
                        {errors.firstName && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.firstName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Middle Name</Label>
                    <div className="relative">
                        <Input
                            className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                            disabled={disabled}
                            placeholder="Santos"
                            {...register("middleName")}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                    <MapPin size={14} weight="bold" /> Complete Address *
                </Label>
                <div className="relative">
                    <Input
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        disabled={disabled}
                        placeholder="House No, Street, Barangay, City, Province"
                        {...register("address")}
                    />
                    {errors.address && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.address.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <CalendarBlank size={14} weight="bold" /> Date of Birth *
                    </Label>
                    <Input
                        type="date"
                        max={todayString}
                        min="1900-01-01"
                        className={`h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 ${
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
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Age</Label>
                    <Input
                        value={calculateAge(watchDob) !== null ? `${calculateAge(watchDob)} years` : ''}
                        disabled
                        placeholder="Calculated automatically"
                        className={`h-10 rounded-lg border-border bg-muted/50 px-4 text-xs font-bold ${
                            (watchDob && calculateAge(watchDob) === null) ? 'text-destructive/60' : 'text-muted-foreground/60'
                        }`}
                    />
                    {(watchDob && calculateAge(watchDob) === null) && (
                        <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">Invalid Age</span>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2 relative">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Birthplace *</Label>
                    <Input
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        disabled={disabled}
                        placeholder="Cagayan de Oro City"
                        {...register("birthPlace")}
                    />
                    {errors.birthPlace && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.birthPlace.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <UserCircle size={14} weight="bold" /> Gender *
                    </Label>
                    <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50">
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border bg-background">
                                    <SelectItem value="Male" className="text-xs font-bold py-2">Male</SelectItem>
                                    <SelectItem value="Female" className="text-xs font-bold py-2">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.gender && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.gender.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Civil Status *</Label>
                    <Controller
                        control={control}
                        name="civilStatus"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50">
                                    <SelectValue placeholder="Select Civil Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border bg-background">
                                    <SelectItem value="Single" className="text-xs font-bold py-2">Single</SelectItem>
                                    <SelectItem value="Married" className="text-xs font-bold py-2">Married</SelectItem>
                                    <SelectItem value="Widowed" className="text-xs font-bold py-2">Widowed</SelectItem>
                                    <SelectItem value="Divorced" className="text-xs font-bold py-2">Divorced</SelectItem>
                                    <SelectItem value="Separated" className="text-xs font-bold py-2">Separated</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.civilStatus && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.civilStatus.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Religion *</Label>
                    <Input
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        disabled={disabled}
                        placeholder="Roman Catholic"
                        {...register("religion")}
                    />
                    {errors.religion && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.religion.message}</span>}
                </div>
            </div>
        </div>
    );
}
