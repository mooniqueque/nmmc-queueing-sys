"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getQueueOptions } from "@/features/shared/api";
import { useCurrentTime } from "@/hooks/use-current-time";
import { calculateAge as libCalculateAge } from "@/lib/utils";
import { PriorityCategory } from "@/types/models";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { FormEvent, useEffect, useState } from "react";
import { getPatientByHospitalId, registerKioskPatient } from "../actions";
import { kioskFormSchema, KioskFormValues } from "../schemas";
import { motion } from "framer-motion";

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
    hospitalId: "",
    categoryIds: []
};

export function KioskForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isRegistered = searchParams.get("type") === "registered";
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const currentTime = useCurrentTime();

    const [formData, setFormData] = useState<KioskFormValues>(initialState);
    const [errors, setErrors] = useState<Partial<Record<keyof KioskFormValues, string>>>({});
    const [availableCategories, setAvailableCategories] = useState<PriorityCategory[]>([]);

    // 1. Set hydration and restore data (using microtask to avoid cascading renders warning)
    useEffect(() => {
        const saved = localStorage.getItem('kiosk-registration-draft');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTimeout(() => {
                    setFormData(prev => ({ ...prev, ...parsed }));
                }, 0);
            } catch (e) {
                console.error("Failed to parse saved draft", e);
            }
        }

        // Fetch categories (assume "TRIAGE" or "GENERAL" for kiosk)
        getQueueOptions("TRIAGE").then(cats => {
            setAvailableCategories(cats);
        }).catch(err => console.error("Failed to fetch categories", err));

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
    // Timer effect to decrement the countdown
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (showSuccessModal && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showSuccessModal, countdown]);

    // Redirect effect that correctly triggers when countdown hits 0
    useEffect(() => {
        if (showSuccessModal && countdown === 0) {
            router.push("/kiosk");
        }
    }, [countdown, showSuccessModal, router]);

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

    const handleCategoryToggle = (categoryId: string) => {
        setFormData(prev => {
            const current = prev.categoryIds || [];
            const next = current.includes(categoryId)
                ? current.filter(id => id !== categoryId)
                : [...current, categoryId];
            return { ...prev, categoryIds: next };
        });
    };

    const calculateAge = () => {
        const { dobMonth, dobDay, dobYear } = formData;
        if (!dobMonth || !dobDay || !dobYear || String(dobYear).length < 4) return "";

        const monthNames: Record<string, number> = {
            "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
            "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
        };
        const mVal = monthNames[dobMonth as string] ?? (Number(dobMonth) - 1);

        const dob = new Date(Number(dobYear), mVal, Number(dobDay));
        if (isNaN(dob.getTime())) return "";

        const today = new Date();
        if (dob > today) return "Invalid";

        const age = libCalculateAge(dob);
        return age !== null ? age : "Invalid";
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
            setMessage({ type: 'error', text: "Please complete the form before submitting." });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        const submitResult = await registerKioskPatient({
            ...formData,
            kioskRegistrationType: isRegistered ? 'REGISTERED' : 'UNREGISTERED'
        });
        setIsLoading(false);

        if (submitResult.success) {
            setMessage({ type: 'success', text: submitResult.message! });

            // Requirements Check:
            // 5. When the form is successfully submitted, clear the stored data from localStorage
            localStorage.removeItem('kiosk-registration-draft');
            setFormData(initialState);
            setErrors({});

            setCountdown(5);
            setShowSuccessModal(true);
        } else {
            setMessage({ type: 'error', text: submitResult.error! });
        }
    }

    const handleClearForm = () => {
        if (window.confirm("Are you sure you want to clear the form? This will erase all inputted information.")) {
            localStorage.removeItem('kiosk-registration-draft');
            setFormData(initialState);
            setErrors({});
            setMessage(null);
        }
    };

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
                    <div className={`p-3 mb-6 border-l-4 text-sm ${message.type === 'success'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'bg-red-50 border-red-500 text-red-800'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Section: Appointment Status */}
                    <div className="p-4 bg-slate-50 border rounded-md space-y-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 block">1. Visit Status</Label>
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

                        {availableCategories.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-slate-200">
                                <Label className="text-sm font-semibold text-emerald-800 block">Special Classification / Priority</Label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {availableCategories.map(cat => (
                                        <div key={cat.id} className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                                            <Checkbox
                                                id={`cat-${cat.id}`}
                                                checked={(formData.categoryIds || []).includes(cat.id)}
                                                onCheckedChange={() => handleCategoryToggle(cat.id)}
                                            />
                                            <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                {cat.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section: Returning Patient Search */}
                    {isRegistered && (<div className="flex items-end gap-2 border-b pb-6">
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
                    )}


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
                                <div className="flex gap-2 relative">
                                    <Input placeholder="Month" list="months-list" name="dobMonth" className={`bg-white w-full ${calculateAge() === "Invalid" ? 'border-red-500' : ''}`} value={formData.dobMonth || ''} onChange={handleChange} />
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
                                    <Input placeholder="Day" maxLength={2} name="dobDay" className={`bg-white w-20 ${calculateAge() === "Invalid" ? 'border-red-500' : ''}`} value={formData.dobDay || ''} onChange={handleChange} />
                                    <Input placeholder="Year" maxLength={4} name="dobYear" className={`bg-white w-24 ${calculateAge() === "Invalid" ? 'border-red-500' : ''}`} value={formData.dobYear || ''} onChange={handleChange} />

                                    {calculateAge() === "Invalid" && !errors.dobMonth && !errors.dobDay && !errors.dobYear && (
                                        <span className="absolute -bottom-5 left-1 text-red-500 text-[10px] font-semibold">Please provide a valid birth date</span>
                                    )}
                                </div>
                                {errors.dobMonth && <p className="text-xs text-red-500">{errors.dobMonth}</p>}
                                {errors.dobDay && <p className="text-xs text-red-500">{errors.dobDay}</p>}
                                {errors.dobYear && <p className="text-xs text-red-500">{errors.dobYear}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input
                                    value={calculateAge()}
                                    disabled
                                    className={`font-medium ${calculateAge() === "Invalid" ? "bg-red-50 text-red-500 border-red-200" : "bg-slate-100"}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthPlace">Birthplace *</Label>
                                <Input id="birthPlace" name="birthPlace" className="bg-white" value={formData.birthPlace} onChange={handleChange} />
                                {errors.birthPlace && <p className="text-xs text-red-500">{errors.birthPlace}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Sex *</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender || ''}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
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
                                <Input id="religion" list="religions-list" name="religion" className="bg-white" value={formData.religion || ''} onChange={handleChange} placeholder="Type or Select" />
                                <datalist id="religions-list">
                                    <option value="Roman Catholic" />
                                    <option value="Islam" />
                                    <option value="Protestantism" />
                                    <option value="Iglesia ni Cristo (INC)" />
                                    <option value="Philippine Independent Church (Aglipayan)" />
                                    <option value="Seventh-day Adventist Church" />
                                    <option value="Members Church of God International (Ang Dating Daan)" />
                                    <option value="Jesus Miracle Crusade" />
                                    <option value="Church of Jesus Christ of Latter-day Saints (Mormons)" />
                                    <option value="Jehovah's Witnesses" />
                                    <option value="Others" />
                                </datalist>
                                {errors.religion && <p className="text-xs text-red-500">{errors.religion}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t mt-8 mb-5 flex gap-4">
                        {/* Cancel / Back Button Container -> takes up 1/3 of the space */}
                        <Link href="/kiosk" className="w-1/3">
                            <Button type="button" variant="outline" className="w-full h-12 text-base font-semibold border-slate-300 text-slate-700">
                                Back
                            </Button>
                        </Link>
                        {/* Clear Form Button Container */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClearForm}
                            className="w-full md:w-1/6 h-12 text-base font-semibold border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                            Clear Form
                        </Button>
                        {/* Submit Button Container */}
                        <Button type="submit" className="w-full md:w-2/4 h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                            {isLoading ? "Submitting Form..." : "Submit Registration"}
                        </Button>
                    </div>
                </form>
            </CardContent>
            {/* Success Modal Overlay */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center"
                        >
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M5 13l4 4L19 7"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                                />
                            </svg>
                        </motion.div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-800">Registration Complete!</h2>
                            <p className="text-slate-500 text-sm">
                                Your intake form has been successfully submitted to the Triage Nurse. Please wait for your name to be called.
                            </p>
                        </div>
                        <div className="w-full flex gap-3 pt-4 border-t border-slate-100">
                            {/* Submit Another Button */}
                            <Button
                                type="button"
                                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setMessage(null);
                                    setCountdown(5);
                                }}
                            >
                                Submit Another ({countdown}s)
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}