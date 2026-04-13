"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/shared/lib/notify";
import { calculateAge, cn } from "@/shared/lib/utils";
import { CalendarBlank, IdentificationBadge, MapPin, UserCircle } from "@phosphor-icons/react";
import { useTransition } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { updateTriageAppointment } from "../actions";
import { TriageFormInput } from "../schemas";
import { useTriageStore } from "../store/use-triage-store";

export function DemographicsSection() {
    const { register, control, formState: { errors } } = useFormContext<TriageFormInput>();
    const watchDob = useWatch({ control, name: "dateOfBirth" });
    const { selectedPatient, isManualEntry } = useTriageStore();
    const [isSavingAppt, startTransition] = useTransition();

    const todayString = new Date().toISOString().split('T')[0];

    // Queued patients are read-only in Triage; only Window Clerk can update demographics.
    const demographicsLocked = !!selectedPatient && !isManualEntry;
    const lockedCursorClass = demographicsLocked ? "cursor-not-allowed" : "";

    return (
        <div className="bg-slate-100/60 p-6 rounded-xl border border-slate-300 shadow-sm transition-all mb-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-300">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                    <IdentificationBadge size={20} className="text-primary" weight="bold" />
                    Patient&apos;s Personal Information
                </h3>

                <Controller
                    control={control}
                    name="hasAppointment"
                    render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-background px-3 py-1.5 rounded-lg border border-slate-300 text-[10px] font-bold text-foreground transition-all hover:border-primary/30">
                            <Switch
                                id="has-appt"
                                checked={field.value as boolean}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);

                                    if (!selectedPatient || isManualEntry) return;

                                    startTransition(async () => {
                                        const res = await updateTriageAppointment(selectedPatient.id, checked);
                                        if (!res?.success) {
                                            field.onChange(!checked);
                                            notify.error("Failed to save appointment status", {
                                                description: res?.error || "Please try again.",
                                            });
                                            return;
                                        }

                                        notify.success("Appointment status updated");
                                    });
                                }}
                                disabled={isSavingAppt}
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
                            className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}
                            readOnly={demographicsLocked}
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
                            className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}
                            readOnly={demographicsLocked}
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
                            className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}
                            readOnly={demographicsLocked}
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
                        className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}
                        readOnly={demographicsLocked}
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
                        className={cn(`h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 ${
                            (watchDob && calculateAge(watchDob) === null) ? 'border-destructive focus:border-destructive' : 'focus:border-primary/50'
                        }`, lockedCursorClass)}
                        readOnly={demographicsLocked}
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
                        className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}
                        readOnly={demographicsLocked}
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
                            <Select disabled={demographicsLocked} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}>
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
                            <Select disabled={demographicsLocked} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className={cn("h-10 rounded-lg border-slate-300 bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50", lockedCursorClass)}>
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
                                className={cn("h-10 text-lg font-semibold text-gray-900", lockedCursorClass)}
                                disabled={demographicsLocked}
                            />
                        )}
                    />
                    {errors.religion && <span className="absolute -bottom-5 left-1 text-destructive text-[9px] font-bold uppercase tracking-widest">{errors.religion.message}</span>}
                </div>
            </div>

            {demographicsLocked && (
                <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                    Patient personal information is locked in Triage. If updates are needed, edit them in Window Clerk.
                </p>
            )}
        </div>
    );
}
