"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { CalendarBlank, UserCircle, MapPin, IdentificationBadge } from "@phosphor-icons/react";

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
        <div className="bg-slate-50/70 p-6 rounded-[20px] border border-slate-200/60 shadow-sm transition-all">
            <div className="flex justify-between items-center bg-white -mt-6 -mx-6 px-6 py-4 rounded-t-[20px] border-b border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-6">
                <h3 className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800">
                    <IdentificationBadge size={22} className="text-emerald-600" weight="duotone" />
                    Patient Demographics
                </h3>
                
                <Controller
                    control={control}
                    name="hasAppointment"
                    render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100">
                            <Switch
                                id="has-appt"
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                                disabled={disabled}
                                className="data-[state=checked]:bg-emerald-600"
                            />
                            <Label htmlFor="has-appt" className="cursor-pointer">Has Appointment</Label>
                        </div>
                    )}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name *</Label>
                    <div className="relative">
                        <Input 
                            className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm text-base font-semibold text-slate-800"
                            disabled={disabled} 
                            placeholder="Dela Cruz"
                            {...register("lastName")} 
                        />
                        {errors.lastName && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.lastName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name *</Label>
                    <div className="relative">
                        <Input 
                            className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm text-base font-semibold text-slate-800" 
                            disabled={disabled} 
                            placeholder="Juan"
                            {...register("firstName")} 
                        />
                        {errors.firstName && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.firstName.message}</span>}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Middle Name</Label>
                    <div className="relative">
                        <Input 
                            className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm text-base font-semibold text-slate-800" 
                            disabled={disabled} 
                            placeholder="Santos"
                            {...register("middleName")} 
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <MapPin size={16} weight="duotone" /> Complete Address *
                </Label>
                <div className="relative">
                    <Input 
                        className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm text-base font-medium text-slate-800" 
                        disabled={disabled} 
                        placeholder="House No, Street, Barangay, City, Province"
                        {...register("address")} 
                    />
                    {errors.address && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.address.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <CalendarBlank size={16} weight="duotone" /> Date of Birth *
                    </Label>
                    <Input 
                        type="date" 
                        className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 shadow-sm font-semibold text-slate-800" 
                        disabled={disabled} 
                        {...register("dateOfBirth")} 
                    />
                    {errors.dateOfBirth && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.dateOfBirth.message}</span>}
                </div>
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Age</Label>
                    <Input 
                        value={calculateAge(watchDob) ? `${calculateAge(watchDob)} years` : ''} 
                        disabled 
                        placeholder="Calculated automatically"
                        className="bg-slate-100 pl-4 h-12 rounded-xl border-slate-200 font-bold text-slate-700 opacity-80" 
                    />
                </div>
                <div className="space-y-2 md:col-span-2 relative">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Birthplace *</Label>
                    <Input 
                        className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 shadow-sm text-base font-medium text-slate-800" 
                        disabled={disabled} 
                        placeholder="Cagayan de Oro City"
                        {...register("birthPlace")} 
                    />
                    {errors.birthPlace && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.birthPlace.message}</span>}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <UserCircle size={16} weight="duotone" /> Gender *
                    </Label>
                    <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="bg-white h-12 rounded-xl shadow-sm border-slate-200 font-semibold text-slate-800">
                                    <SelectValue placeholder="Select Gender" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-lg border-slate-200">
                                    <SelectItem value="Male" className="font-medium cursor-pointer">Male</SelectItem>
                                    <SelectItem value="Female" className="font-medium cursor-pointer">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.gender && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.gender.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Civil Status *</Label>
                    <Controller
                        control={control}
                        name="civilStatus"
                        render={({ field }) => (
                            <Select disabled={disabled} onValueChange={field.onChange} value={field.value as string}>
                                <SelectTrigger className="bg-white h-12 rounded-xl shadow-sm border-slate-200 font-semibold text-slate-800">
                                    <SelectValue placeholder="Select Civil Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-lg">
                                    <SelectItem value="Single" className="font-medium cursor-pointer">Single</SelectItem>
                                    <SelectItem value="Married" className="font-medium cursor-pointer">Married</SelectItem>
                                    <SelectItem value="Widowed" className="font-medium cursor-pointer">Widowed</SelectItem>
                                    <SelectItem value="Divorced" className="font-medium cursor-pointer">Divorced</SelectItem>
                                    <SelectItem value="Separated" className="font-medium cursor-pointer">Separated</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.civilStatus && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.civilStatus.message}</span>}
                </div>
                <div className="space-y-2 relative">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Religion *</Label>
                    <Input 
                        className="bg-white pl-4 h-12 rounded-xl border-slate-200 focus:border-emerald-500 shadow-sm text-base font-medium text-slate-800" 
                        disabled={disabled} 
                        placeholder="Roman Catholic"
                        {...register("religion")} 
                    />
                    {errors.religion && <span className="absolute -bottom-5 left-1 text-red-500 text-xs font-bold">{errors.religion.message}</span>}
                </div>
            </div>
        </div>
    );
}
