"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCurrentTime } from "@/hooks/use-current-time";
import React, { useEffect, useState, FormEvent } from "react";
import { getPatientByHospitalId, registerKioskPatient } from "../actions";
import { kioskFormSchema, KioskFormValues } from "../schemas";

const initialState: KioskFormValues = {
    hasAppointment: false,
    gender: "" as KioskFormValues["gender"],
    civilStatus: "" as KioskFormValues["civilStatus"],
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    contactNo: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    age: undefined,
    birthPlace: "",
    religion: "",
    hospitalId: ""
};

export function KioskForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const currentTime = useCurrentTime();

    const [formData, setFormData] = useState<KioskFormValues>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof KioskFormValues, string>>>({});

    // 1. Set hydration and restore data (using microtask to avoid cascading renders warning)
    useEffect(() => {
        const saved = localStorage.getItem('kiosk-registration-draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deferring update to next tick to satisfy strict React Compiler rules
                setTimeout(() => {
                    setFormData(prev => ({ ...prev, ...parsed }));
                }, 0);
            } catch (e) {
                console.error("Failed to parse saved draft", e);
            }
        }
        setTimeout(() => setIsHydrated(true), 0);
    }, []);

    // Update localStorage whenever formData changes
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem('kiosk-registration-draft', JSON.stringify(formData));
        }
    }, [formData, isHydrated]);

    /**
     * Requirements Check: 
     * 7. Use a clean React pattern with useState, useEffect, and a single handleChange function.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string, value: unknown }) => {
        if ('target' in e) {
            const { name, value } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            
            // Clear error when field changes
            if (errors[name as keyof KioskFormValues]) {
                setErrors(prev => ({ ...prev, [name]: undefined }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [e.name]: e.value
            }));

            // Clear error when field changes
            if (errors[e.name as keyof KioskFormValues]) {
                setErrors(prev => ({ ...prev, [e.name]: undefined }));
            }
        }
    };

    const calculateAge = () => {
        const { dobMonth, dobDay, dobYear } = formData;
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
        if (!formData.hospitalId || !formData.hospitalId.trim()) {
            setMessage({ type: 'error', text: "Please enter a Hospital ID to search." });
            return;
        }

        setIsSearching(true); 
        setMessage(null);
        const result = await getPatientByHospitalId(formData.hospitalId);
        setIsSearching(false);

        if (result.success && result.data) {
            setMessage({ type: 'success', text: "Patient record found." });
            const dobDate = new Date(result.data.dateOfBirth);
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            setFormData(prev => ({
                ...prev,
                hospitalId: result.data.hospitalId || "",
                firstName: result.data.firstName,
                middleName: result.data.middleName || "",
                lastName: result.data.lastName,
                dobMonth: monthNames[dobDate.getMonth()],
                dobDay: String(dobDate.getDate()).padStart(2, '0'),
                dobYear: String(dobDate.getFullYear()),
                gender: result.data.gender as KioskFormValues["gender"],
                address: result.data.address || "",
                contactNo: result.data.contactNo || "",
                birthPlace: result.data.birthPlace || "",
                religion: result.data.religion || "",
                civilStatus: result.data.civilStatus as KioskFormValues["civilStatus"],
            }));
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        
        // Manual Validation using Zod
        const result = kioskFormSchema.safeParse(formData);
        if (!result.success) {
            const newErrors: Partial<Record<keyof KioskFormValues, string>> = {};
            result.error.issues.forEach(err => {
                const path = err.path[0] as keyof KioskFormValues;
                if (path) newErrors[path] = err.message;
            });
            setErrors(newErrors);
            setMessage({ type: 'error', text: "Please fix the errors in the form." });
            return;
        }

        setIsLoading(true); 
        setMessage(null);
        const submitResult = await registerKioskPatient(formData);
        setIsLoading(false);

        if (submitResult.success) {
            setMessage({ type: 'success', text: submitResult.message! });
            
            // Requirements Check:
            // 5. When the form is successfully submitted, clear the stored data from localStorage
            localStorage.removeItem('kiosk-registration-draft');
            setFormData(initialState);
            setErrors({});
        } else {
            setMessage({ type: 'error', text: submitResult.error! });
        }
    }

    // SSR Guard
    if (!isHydrated) return null;

    return (
        <Card className="w-full max-w-4xl shadow-sm border-slate-300">
            {/* CARD HEADER */}
            <CardHeader className="border-b flex flex-col items-center py-5">
                <CardTitle className="text-2xl font-extrabold uppercase tracking-wider text-emerald-800">
                    Patient Intake Form
                </CardTitle>
                <div className="text-sm font-mono text-slate-500">
                    {currentTime ? (
                        `${currentTime.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })} | ${currentTime.toLocaleTimeString()}`
                    ) : (
                        '\u00A0'
                    )}
                </div>
            </CardHeader>

            {/* CARD CONTENT */}
            <CardContent className="pt-3">
                {message && (
                    <div className={`p-3 mb-6 border-l-4 text-sm ${
                        message.type === 'success' 
                        ? 'bg-green-50 border-green-500 text-green-800' 
                        : 'bg-red-50 border-red-500 text-red-800'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Section: Appointment Status */}
                    <div className="p-4 bg-slate-50 border rounded-md">
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">1. Visit Status</Label>
                        <RadioGroup
                            onValueChange={(val) => handleChange({ name: "hasAppointment", value: val === "true" })}
                            value={formData.hasAppointment ? "true" : "false"}
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
                    </div>

                    {/* Section: Returning Patient Search */}
                    <div className="flex items-end gap-2 border-b pb-6">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="hospitalId" className="text-xs font-semibold text-slate-500 uppercase">Hospital ID (Returning Patients Only)</Label>
                            <Input 
                                id="hospitalId" 
                                name="hospitalId"
                                placeholder="NMMC-XXXX" 
                                className="max-w-xs bg-white" 
                                value={formData.hospitalId}
                                onChange={handleChange}
                            />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleSearchId} disabled={isSearching}>
                            {isSearching ? "Searching..." : "Search Records"}
                        </Button>
                    </div>

                    {/* Section: Patient Demographics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase">2. Patient Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input id="lastName" name="lastName" className="bg-white" value={formData.lastName} onChange={handleChange} />
                                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input id="firstName" name="firstName" className="bg-white" value={formData.firstName} onChange={handleChange} />
                                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middleName">Middle Name</Label>
                                <Input id="middleName" name="middleName" className="bg-white" value={formData.middleName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Complete Address *</Label>
                            <Input id="address" name="address" className="bg-white" value={formData.address} onChange={handleChange} />
                            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactNo">Mobile / Contact Number</Label>
                            <Input id="contactNo" name="contactNo" placeholder="e.g. 09123456789" className="bg-white" value={formData.contactNo || ''} onChange={handleChange} />
                            {errors.contactNo && <p className="text-xs text-red-500">{errors.contactNo}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Date of Birth *</Label>
                                <div className="flex gap-2">
                                    <Input placeholder="Month" list="months-list" name="dobMonth" className="bg-white w-full" value={formData.dobMonth || ''} onChange={handleChange} />
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
                                    <Input placeholder="Day" maxLength={2} name="dobDay" className="bg-white w-20" value={formData.dobDay || ''} onChange={handleChange} />
                                    <Input placeholder="Year" maxLength={4} name="dobYear" className="bg-white w-24" value={formData.dobYear || ''} onChange={handleChange} />
                                </div>
                                {errors.dobMonth && <p className="text-xs text-red-500">{errors.dobMonth}</p>}
                                {errors.dobDay && <p className="text-xs text-red-500">{errors.dobDay}</p>}
                                {errors.dobYear && <p className="text-xs text-red-500">{errors.dobYear}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input value={calculateAge()} disabled className="bg-slate-100 font-medium" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthPlace">Birthplace *</Label>
                                <Input id="birthPlace" name="birthPlace" className="bg-white" value={formData.birthPlace} onChange={handleChange} />
                                {errors.birthPlace && <p className="text-xs text-red-500">{errors.birthPlace}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <select 
                                    id="gender" 
                                    name="gender" 
                                    value={formData.gender || ''} 
                                    onChange={handleChange} 
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Prefer not to Say">Prefer not to Say</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="civilStatus">Civil Status *</Label>
                                <select 
                                    id="civilStatus" 
                                    name="civilStatus" 
                                    value={formData.civilStatus || ''} 
                                    onChange={handleChange} 
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                    <option value="">Select Status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Separated">Separated</option>
                                </select>
                                {errors.civilStatus && <p className="text-xs text-red-500">{errors.civilStatus}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="religion">Religion *</Label>
                                <Input id="religion" name="religion" className="bg-white" value={formData.religion || ''} onChange={handleChange} />
                                {errors.religion && <p className="text-xs text-red-500">{errors.religion}</p>}
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