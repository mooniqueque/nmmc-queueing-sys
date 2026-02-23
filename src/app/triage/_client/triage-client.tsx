"use client"

import { markNoShowAction, removeQueueAction, restoreNoShowAction, submitTriageAction } from "@/actions/triage-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { triageFormSchema, TriageFormValues } from "@/lib/schemas/triage-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

type VisitWithPatient = Prisma.VisitGetPayload<{
    include: { patient: true }
}>;

export default function TriageDashboardClient({ initialQueue }: { initialQueue: VisitWithPatient[] }) {
    const router = useRouter();
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
    const [isPending, startTransition] = useTransition();
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"ACTIVE" | "NO_SHOW">("ACTIVE");

    const activeQueue = initialQueue.filter(v => v.status === "KIOSK_SUBMITTED");
    const noShowQueue = initialQueue.filter(v => v.status === "NO_SHOW");

    const handleNoShow = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await markNoShowAction(visitId);
            if (res.error) setSubmitError(res.error);
            if (selectedPatient?.id === visitId) setSelectedPatient(null);
        });
    }

    const handleRestore = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        startTransition(async () => {
            const res = await restoreNoShowAction(visitId);
            if (res.error) setSubmitError(res.error);
        });
    }

    const handleRemove = (visitId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to completely remove this patient from the triage queue?")) return;
        startTransition(async () => {
            const res = await removeQueueAction(visitId);
            if (res.error) setSubmitError(res.error);
            if (selectedPatient?.id === visitId) setSelectedPatient(null);
        });
    }

    const form = useForm<z.input<typeof triageFormSchema>, unknown, TriageFormValues>({
        resolver: zodResolver(triageFormSchema),
        defaultValues: {
            isManualEntry: false,
            firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
            address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
            bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
            hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
        }
    });

    const watchDob = useWatch({ control: form.control, name: "dateOfBirth" });
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

    useEffect(() => {
        if (isManualEntry) {
            form.reset({
                isManualEntry: true,
                firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
                address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
                bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
            });
        } else if (selectedPatient) {
            form.reset({
                isManualEntry: false,
                firstName: selectedPatient.patient.firstName,
                middleName: selectedPatient.patient.middleName || "",
                lastName: selectedPatient.patient.lastName,
                dateOfBirth: new Date(selectedPatient.patient.dateOfBirth).toISOString().split('T')[0],
                gender: selectedPatient.patient.gender,
                address: selectedPatient.patient.address || "",
                birthPlace: selectedPatient.patient.birthPlace || "",
                religion: selectedPatient.patient.religion || "",
                civilStatus: selectedPatient.patient.civilStatus || "Single",
                hasAppointment: selectedPatient.hasAppointment || false,
                bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
            });
        } else {
            form.reset();
        }
    }, [isManualEntry, selectedPatient, form]);

    // SET UP SSE FOR REAL-TIME QUEUE UPDATES
    useEffect(() => {
        const eventSource = new EventSource('/api/stream/queue');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'queue-updated') {
                    // Start a non-blocking transition to refresh the Next.js Server Component payload
                    // This seamlessly updates initialQueue without losing local component React state!
                    startTransition(() => {
                        router.refresh();
                    });
                }
            } catch (error) {
                console.error("Failed to parse SSE message:", error);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            eventSource.close();
            // Optional: Implement reconnection logic here if needed
        };

        // Clean up connection when component unmounts
        return () => {
            eventSource.close();
        };
    }, [router]);

    const onSubmit = (values: TriageFormValues) => {
        setSubmitError("");
        setSubmitSuccess(false);

        startTransition(async () => {
            const res = await submitTriageAction(values, selectedPatient?.id);
            if (res.error) {
                setSubmitError(res.error as string);
            } else {
                setSubmitSuccess(true);
                setTimeout(() => {
                    setIsManualEntry(false);
                    setSelectedPatient(null);
                    setSubmitSuccess(false);
                    form.reset();
                }, 2000);
            }
        });
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] p-4 gap-6 bg-slate-50/50">

            {/* CENTER COLUMN: THE TRIAGE WORKSPACE */}
            <div className="flex-1 overflow-y-auto pr-2">
                <Card className="shadow-lg border-t-4 border-t-emerald-600">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl font-bold text-emerald-900">TRIAGE ASSESSMENT FORM</CardTitle>
                                <CardDescription className="text-emerald-700 font-medium mt-1">
                                    TO BE FILLED OUT BY TRIAGE OFFICER
                                </CardDescription>
                            </div>

                            {/* THE MAGIC MANUAL ENTRY TOGGLE */}
                            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                                <Switch
                                    id="manual-entry"
                                    checked={isManualEntry}
                                    onCheckedChange={(checked) => {
                                        setSubmitError("");
                                        setSubmitSuccess(false);
                                        setIsManualEntry(checked);
                                        if (checked) setSelectedPatient(null);
                                    }}
                                />
                                <Label htmlFor="manual-entry" className="font-bold text-slate-700 cursor-pointer">
                                    Walk-in / Manual Entry
                                </Label>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6">
                        {(!isManualEntry && !selectedPatient) ? (
                            <div className="h-64 flex items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-lg">
                                Please select a patient from the queue or switch to Manual Entry.
                            </div>
                        ) : (
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                                {/* DEMOGRAPHICS SECTION */}
                                <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <h3 className="font-bold text-slate-700 uppercase">Patient Demographics</h3>
                                        <Controller
                                            control={form.control}
                                            name="hasAppointment"
                                            render={({ field }) => (
                                                <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-md border text-sm font-semibold text-slate-700">
                                                    <Switch
                                                        checked={field.value as boolean}
                                                        onCheckedChange={field.onChange}
                                                        disabled={!isManualEntry && !!selectedPatient}
                                                    />
                                                    <Label className="cursor-pointer">Has Appointment</Label>
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Last Name *</Label>
                                            <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("lastName")} />
                                            {form.formState.errors.lastName && <span className="text-red-500 text-xs">{form.formState.errors.lastName.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>First Name *</Label>
                                            <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("firstName")} />
                                            {form.formState.errors.firstName && <span className="text-red-500 text-xs">{form.formState.errors.firstName.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Middle Name</Label>
                                            <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("middleName")} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Complete Address *</Label>
                                        <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("address")} />
                                        {form.formState.errors.address && <span className="text-red-500 text-xs">{form.formState.errors.address.message}</span>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date of Birth *</Label>
                                            <Input type="date" className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("dateOfBirth")} />
                                            {form.formState.errors.dateOfBirth && <span className="text-red-500 text-xs">{form.formState.errors.dateOfBirth.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Age</Label>
                                            <Input value={calculateAge(watchDob)} disabled className="bg-slate-100 font-medium text-slate-700" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Birthplace *</Label>
                                            <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("birthPlace")} />
                                            {form.formState.errors.birthPlace && <span className="text-red-500 text-xs">{form.formState.errors.birthPlace.message}</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Gender *</Label>
                                            <Controller
                                                control={form.control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <Select disabled={!isManualEntry && !!selectedPatient} onValueChange={field.onChange} value={field.value as string}>
                                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Male">Male</SelectItem>
                                                            <SelectItem value="Female">Female</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {form.formState.errors.gender && <span className="text-red-500 text-xs">{form.formState.errors.gender.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Civil Status *</Label>
                                            <Controller
                                                control={form.control}
                                                name="civilStatus"
                                                render={({ field }) => (
                                                    <Select disabled={!isManualEntry && !!selectedPatient} onValueChange={field.onChange} value={field.value as string}>
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
                                            {form.formState.errors.civilStatus && <span className="text-red-500 text-xs">{form.formState.errors.civilStatus.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Religion *</Label>
                                            <Input className="bg-white" disabled={!isManualEntry && !!selectedPatient} {...form.register("religion")} />
                                            {form.formState.errors.religion && <span className="text-red-500 text-xs">{form.formState.errors.religion.message}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* VITALS SECTION */}
                                <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-4">
                                    <h3 className="font-bold text-slate-700 uppercase border-b border-blue-200 pb-2">Vital Signs</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="space-y-2">
                                            <Label>Blood Pressure</Label>
                                            <Input placeholder="120/80" {...form.register("bloodPressure")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Heart Rate (bpm)</Label>
                                            <Input type="number" placeholder="80" {...form.register("heartRate")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Resp. Rate (cpm)</Label>
                                            <Input type="number" placeholder="18" {...form.register("respiratoryRate")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Temp (°C)</Label>
                                            <Input type="number" step="0.1" placeholder="37.0" {...form.register("temperature")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>O2 Saturation (%)</Label>
                                            <Input type="number" max="100" placeholder="98" {...form.register("oxygenSat")} />
                                        </div>
                                    </div>
                                </div>

                                {/* SYMPTOMS FLAGS SECTION */}
                                <div className="p-5 bg-amber-50/50 rounded-lg border border-amber-100 space-y-4">
                                    <h3 className="font-bold text-slate-700 uppercase border-b border-amber-200 pb-2">Symptoms & Alerts</h3>
                                    <div className="flex flex-wrap gap-6">
                                        {(['hasCough', 'hasColds', 'hasFever', 'hasRashes', 'isInfectious'] as const).map((symptom) => (
                                            <Controller
                                                key={symptom}
                                                control={form.control}
                                                name={symptom}
                                                render={({ field }) => (
                                                    <div className="flex items-center space-x-2">
                                                        <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                                                        <Label className="capitalize">{symptom.replace('has', '').replace('is', '')}</Label>
                                                    </div>
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* CLINICAL NOTES */}
                                <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                                    <h3 className="font-bold text-slate-700 uppercase border-b pb-2">Clinical Assessment</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="font-semibold text-red-600">Chief Complaint *</Label>
                                            <textarea
                                                className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                                                placeholder="Primary reason for visit..."
                                                {...form.register("chiefComplaint")}
                                            />
                                            {form.formState.errors.chiefComplaint && <span className="text-red-500 text-xs">{form.formState.errors.chiefComplaint.message}</span>}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Medical History (Optional)</Label>
                                                <textarea
                                                    className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                                                    {...form.register("medicalHistory")}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Triage Remarks (Optional)</Label>
                                                <textarea
                                                    className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                                                    {...form.register("triageRemarks")}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DISPOSITION & ACTIONS */}
                                <div className="flex items-center justify-between border-t pt-6">
                                    <div className="flex gap-4">
                                        <div className="w-48">
                                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Acuity / Disposition</Label>
                                            <Controller
                                                control={form.control}
                                                name="disposition"
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger className={field.value === "EMERGENT" ? "border-red-500 text-red-700 font-bold bg-red-50" : field.value === "URGENT" ? "border-amber-500 text-amber-700 font-bold bg-amber-50" : ""}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="NON-URGENT">Non-Urgent</SelectItem>
                                                            <SelectItem value="URGENT">Urgent</SelectItem>
                                                            <SelectItem value="EMERGENT">Emergent (Critical)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        {submitError && <span className="text-red-500 text-sm font-bold mb-2">{submitError}</span>}
                                        {submitSuccess && <span className="text-emerald-500 text-sm font-bold mb-2">Triage Completed!</span>}

                                        <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 w-48 font-bold text-lg h-12 shadow-md">
                                            {isPending ? "Submitting..." : "SUBMIT TO QUEUE"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>


            {/* RIGHT COLUMN: THE QUEUE SIDEBAR */}
            <div className="w-80 flex flex-col bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden shrink-0">
                <div className="p-4 bg-emerald-900 border-b border-emerald-800 flex justify-between items-center shrink-0">
                    <h2 className="font-bold text-white tracking-wide">WAITING FOR TRIAGE</h2>
                </div>

                {/* Tabs */}
                <div className="flex bg-emerald-800 shrink-0">
                    <button
                        onClick={() => setActiveTab("ACTIVE")}
                        className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === "ACTIVE" ? "bg-emerald-700 text-white border-b-2 border-emerald-300" : "text-emerald-300 hover:text-white"}`}
                    >
                        ACTIVE ({activeQueue.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("NO_SHOW")}
                        className={`flex-1 py-3 text-xs font-bold transition-colors border-l border-emerald-900 ${activeTab === "NO_SHOW" ? "bg-slate-700 text-white border-b-2 border-slate-300" : "text-emerald-300 hover:text-white"}`}
                    >
                        NO SHOW ({noShowQueue.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 pointer-events-auto bg-slate-50 relative">
                    {/* Overlay spinner when queue is updating */}
                    {isPending && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-700 animate-pulse bg-white px-4 py-2 rounded-lg shadow-md">Updating Queue...</span>
                        </div>
                    )}

                    {activeTab === "ACTIVE" ? (
                        activeQueue.length === 0 ? (
                            <div className="text-center text-slate-400 py-12 text-sm font-medium">No active patients in queue.</div>
                        ) : (
                            activeQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    onClick={() => {
                                        if (!isManualEntry) {
                                            setSubmitError("");
                                            setSubmitSuccess(false);
                                            setSelectedPatient(visit);
                                        }
                                    }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all shadow-sm flex flex-col gap-2 ${isManualEntry
                                        ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                                        : selectedPatient?.id === visit.id
                                            ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20"
                                            : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                                            {visit.patient.lastName}, {visit.patient.firstName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                        <span>Queued: {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => handleNoShow(visit.id, e)}
                                            className="flex-1 px-2 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-[10px] font-bold uppercase transition-colors"
                                        >
                                            No Show
                                        </button>
                                        <button
                                            disabled={isPending}
                                            onClick={(e) => handleRemove(visit.id, e)}
                                            className="flex-1 px-2 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-[10px] font-bold uppercase transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        noShowQueue.length === 0 ? (
                            <div className="text-center text-slate-400 py-12 text-sm font-medium">No missed patients today.</div>
                        ) : (
                            noShowQueue.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="p-3 rounded-lg border bg-slate-100 border-slate-300 shadow-sm flex flex-col gap-2"
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-700 uppercase tracking-tight text-sm">
                                            {visit.patient.lastName}, {visit.patient.firstName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium pb-1 border-b border-slate-200">
                                        <span className="text-amber-700 font-bold">MARKED NO SHOW</span>
                                        <span>{new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <button
                                        disabled={isPending}
                                        onClick={(e) => handleRestore(visit.id, e)}
                                        className="w-full mt-1 px-2 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded text-[10px] font-bold uppercase transition-colors"
                                    >
                                        Restore to Active Queue
                                    </button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

        </div>
    )
}
