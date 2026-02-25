"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getPatientByHospitalId, submitKioskRegistration } from "../_actions/patient-actions";
import { kioskFormSchema, KioskFormValues } from "../_schemas/patient-schema";

export function KioskForm() {
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
            dobMonth: "",
            dobDay: "",
            dobYear: "",
            birthPlace: "",
            religion: "",
            hospitalId: ""
        }
    });

    const dobMonth = useWatch({ control, name: "dobMonth" });
    const dobDay = useWatch({ control, name: "dobDay" });
    const dobYear = useWatch({ control, name: "dobYear" });

    const calculateAge = () => {
        if (!dobMonth || !dobDay || !dobYear || String(dobYear).length < 4) return "";

        const monthNames: Record<string, number> = {
            "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
            "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
        };
        const mVal = monthNames[dobMonth as string] || Number(dobMonth);

        const today = new Date();
        const birthDate = new Date(Number(dobYear), mVal - 1, Number(dobDay));
        if (isNaN(birthDate.getTime())) return "";

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
            const dobDate = new Date(result.data.dateOfBirth);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            setValue("hospitalId", result.data.hospitalId || "");
            setValue("firstName", result.data.firstName);
            setValue("middleName", result.data.middleName || "");
            setValue("lastName", result.data.lastName);
            setValue("dobMonth", monthNames[dobDate.getMonth()]);
            setValue("dobDay", String(dobDate.getDate()).padStart(2, '0'));
            setValue("dobYear", String(dobDate.getFullYear()));
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

        const monthNamesToNum: Record<string, string> = {
            "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
            "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
        };
        const formattedMonth = monthNamesToNum[data.dobMonth] || String(data.dobMonth).padStart(2, '0');

        // Combine 3 separate strings into a valid YYYY-MM-DD
        const compiledDob = `${data.dobYear}-${formattedMonth}-${String(data.dobDay).padStart(2, '0')}`;
        submitData.append("dateOfBirth", compiledDob);

        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'dobMonth' && key !== 'dobDay' && key !== 'dobYear' && value !== undefined && value !== null) {
                submitData.append(key, value.toString());
            }
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
                            <div className="space-y-2 md:col-span-2">
                                <Label>Date of Birth *</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Month" list="months-list" className="bg-white w-full" {...register("dobMonth")} />
                                    <datalist id="months-list">
                                        <option value="January" />
                                        <option value="February" />
                                        <option value="March" />
                                        <option value="April" />
                                        <option value="May" />
                                        <option value="June" />
                                        <option value="July" />
                                        <option value="August" />
                                        <option value="September" />
                                        <option value="October" />
                                        <option value="November" />
                                        <option value="December" />
                                    </datalist>
                                    <Input placeholder="Day" maxLength={2} className="bg-white w-20" {...register("dobDay")} />
                                    <Input placeholder="Year" maxLength={4} className="bg-white w-24" {...register("dobYear")} />
                                </div>
                                {errors.dobMonth && <p className="text-xs text-red-500">{errors.dobMonth.message}</p>}
                                {errors.dobDay && <p className="text-xs text-red-500">{errors.dobDay.message}</p>}
                                {errors.dobYear && <p className="text-xs text-red-500">{errors.dobYear.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input value={calculateAge()} disabled className="bg-slate-100 font-medium" />
                            </div>
                            <div className="space-y-2">
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
    );
}