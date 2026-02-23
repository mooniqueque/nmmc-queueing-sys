"use client"

import { getPatientByHospitalId, submitKioskRegistration } from "@/actions/patient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { kioskFormSchema, KioskFormValues } from "@/lib/schemas/patient-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

export default function KioskPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const { register, handleSubmit, setValue, getValues, reset, control, formState: { errors } } = useForm<z.input<typeof kioskFormSchema>, unknown, KioskFormValues>({
        resolver: zodResolver(kioskFormSchema),
        defaultValues: {
            hasAppointment: false,
            gender: "" as unknown as "Male" | "Female",
            civilStatus: "" as unknown as "Single" | "Married" | "Widowed" | "Divorced" | "Separated",
            firstName: "",
            middleName: "",
            lastName: "",
            address: "",
            dateOfBirth: "",
            birthPlace: "",
            religion: "",
            hospitalId: ""
        }
    });

    const watchDob = useWatch({ control, name: "dateOfBirth" });
    const calculateAge = (dobString: string | undefined) => {
        if (!dobString) return "";
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : "";
    };

    async function handleSearchId() {
        const hospitalIdInput = getValues("hospitalId");
        if (!hospitalIdInput || !hospitalIdInput.trim()) {
            setMessage({ type: 'error', text: "Please enter a Hospital ID to search." });
            return;
        }

        setIsSearching(true); setMessage(null);
        const result = await getPatientByHospitalId(hospitalIdInput);
        setIsSearching(false);

        if (result.success && result.data) {
            setMessage({ type: 'success', text: "Patient record found." });
            const dob = new Date(result.data.dateOfBirth).toISOString().split('T')[0];
            setValue("hospitalId", result.data.hospitalId || "");
            setValue("firstName", result.data.firstName);
            setValue("middleName", result.data.middleName || "");
            setValue("lastName", result.data.lastName);
            setValue("dateOfBirth", dob);
            setValue("gender", result.data.gender as "Male" | "Female");
            setValue("address", result.data.address || "");
            setValue("birthPlace", result.data.birthPlace || "");
            setValue("religion", result.data.religion || "");
            setValue("civilStatus", result.data.civilStatus as "Single" | "Married" | "Widowed" | "Divorced" | "Separated");
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    }

    async function onSubmit(data: KioskFormValues) {
        setIsLoading(true); setMessage(null);
        const submitData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) submitData.append(key, value.toString());
        });

        const result = await submitKioskRegistration(submitData);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message! });
            reset();
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-8">
            <Card className="w-full max-w-4xl shadow-sm border-slate-300">
                <CardHeader className="border-b bg-slate-50 flex flex-col items-center py-6">
                    <CardTitle className="text-2xl font-semibold uppercase tracking-wider text-slate-800">
                        Patient Intake Form
                    </CardTitle>
                    <div className="text-sm font-mono text-slate-500 mt-2">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {currentTime.toLocaleTimeString()}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {message && (
                        <div className={`p-3 mb-6 border-l-4 text-sm ${message.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit((data) => onSubmit(data as KioskFormValues))} className="space-y-6">
                        {/* Section: Appointment Status */}
                        <div className="p-4 bg-slate-50 border rounded-md">
                            <Label className="text-sm font-semibold text-slate-700 mb-3 block">1. Visit Status</Label>
                            <Controller
                                control={control}
                                name="hasAppointment"
                                render={({ field }) => (
                                    <RadioGroup
                                        onValueChange={(val) => field.onChange(val === "true")}
                                        value={field.value ? "true" : "false"}
                                        className="flex gap-6"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="appt-yes" />
                                            <Label htmlFor="appt-yes" className="font-normal cursor-pointer">With Appointment</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="appt-no" />
                                            <Label htmlFor="appt-no" className="font-normal cursor-pointer">Without Appointment (Walk-in)</Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </div>

                        {/* Section: Returning Patient Search */}
                        <div className="flex items-end gap-2 border-b pb-6">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="hospitalId" className="text-xs font-semibold text-slate-500 uppercase">Hospital ID (Returning Patients Only)</Label>
                                <Input id="hospitalId" placeholder="NMMC-XXXX" className="max-w-xs bg-white" {...register("hospitalId")} />
                            </div>
                            <Button type="button" variant="secondary" onClick={handleSearchId} disabled={isSearching}>
                                {isSearching ? "Searching..." : "Search Records"}
                            </Button>
                        </div>

                        {/* Section: Patient Demographics */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase">2. Patient Demographics</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input id="lastName" className="bg-white" {...register("lastName")} />
                                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input id="firstName" className="bg-white" {...register("firstName")} />
                                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="middleName">Middle Name</Label>
                                    <Input id="middleName" className="bg-white" {...register("middleName")} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Complete Address *</Label>
                                <Input id="address" className="bg-white" {...register("address")} />
                                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                    <Input id="dateOfBirth" type="date" className="bg-white" {...register("dateOfBirth")} />
                                    {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input value={calculateAge(watchDob)} disabled className="bg-slate-100 font-medium" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="birthPlace">Birthplace *</Label>
                                    <Input id="birthPlace" className="bg-white" {...register("birthPlace")} />
                                    {errors.birthPlace && <p className="text-xs text-red-500">{errors.birthPlace.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender *</Label>
                                    <select id="gender" {...register("gender")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                    {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="civilStatus">Civil Status *</Label>
                                    <select id="civilStatus" {...register("civilStatus")} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                                        <option value="">Select Status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                    {errors.civilStatus && <p className="text-xs text-red-500">{errors.civilStatus.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="religion">Religion *</Label>
                                    <Input id="religion" className="bg-white" {...register("religion")} />
                                    {errors.religion && <p className="text-xs text-red-500">{errors.religion.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t mt-8">
                            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                                {isLoading ? "Submitting Form..." : "Submit Registration"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
