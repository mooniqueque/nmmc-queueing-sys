"use client"

import { getPatientByHospitalId, submitKioskRegistration } from "@/actions/patient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MdSearch } from "react-icons/md";

// 1. Zod & RHF Imports
import { kioskFormSchema, KioskFormValues } from "@/lib/schemas/patient-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function KioskPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 2. Initialize React Hook Form
    // This replaces all our manual `useState` and `onChange` code!
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        reset,
        formState: { errors }
    } = useForm<KioskFormValues>({
        // This is the Magic Link! RHF now obeys our Zod rules.
        resolver: zodResolver(kioskFormSchema),
        defaultValues: {
            hospitalId: "",
            firstName: "",
            lastName: "",
            dateOfBirth: "",
            gender: undefined // Zod enum needs to start undefined to force a selection
        }
    });

    // 3. The Auto-Fill Search Function (Updated for RHF)
    async function handleSearchId() {
        // We use getValues() to read what RHF has captured in the Hospital ID box
        const hospitalIdInput = getValues("hospitalId");

        if (!hospitalIdInput || !hospitalIdInput.trim()) {
            setMessage({ type: 'error', text: "Please enter a Hospital ID to search." });
            return;
        }

        setIsSearching(true);
        setMessage(null);

        const result = await getPatientByHospitalId(hospitalIdInput);
        setIsSearching(false);

        if (result.success && result.data) {
            setMessage({ type: 'success', text: "Patient record found! Please verify the details below." });
            const dob = new Date(result.data.dateOfBirth).toISOString().split('T')[0];

            // We use setValue to push data into RHF
            setValue("hospitalId", result.data.hospitalId || "");
            setValue("firstName", result.data.firstName);
            setValue("lastName", result.data.lastName);
            setValue("dateOfBirth", dob);
            // Cast string to "Male" | "Female" for React Hook Form's strong typing
            setValue("gender", result.data.gender as "Male" | "Female");
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    }

    // 4. The Submit Function (Updated for RHF)
    // Notice how clean this is? RHF already validated the data against Zod before this even runs!
    async function onSubmit(data: KioskFormValues) {
        setIsLoading(true);
        setMessage(null);

        const submitData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value) submitData.append(key, value as string);
        });

        const result = await submitKioskRegistration(submitData);
        setIsLoading(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message! });
            reset(); // Tell RHF to clear all fields!
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-emerald-800">NMMC Kiosk</CardTitle>
                    <CardDescription className="text-base text-slate-600">
                        Please enter your details to join the Triage Queue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {message && (
                        <div className={`p-4 mb-6 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Notice handleSubmit wrapping our onSubmit function! */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="hospitalId">Hospital ID (Optional - For Returning Patients)</Label>
                            <div className="flex gap-2">
                                {/* MAGIC: We use ...register("fieldName") to connect the input to RHF */}
                                <Input
                                    id="hospitalId"
                                    placeholder="e.g. NMMC-12345"
                                    {...register("hospitalId")}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSearchId}
                                    disabled={isSearching}
                                    className="px-3"
                                >
                                    {isSearching ? "..." : <MdSearch size={20} />}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input id="firstName" {...register("firstName")} />
                                {/* Display Zod Error instantly! */}
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input id="lastName" {...register("lastName")} />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                                {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <select
                                    id="gender"
                                    {...register("gender")}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 mt-6 h-12 text-lg" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Join Queue"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
