"use client"

import { submitTriageAction } from "@/actions/triage-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { triageFormSchema, TriageFormValues } from "@/lib/schemas/triage-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma } from "@prisma/client";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

type VisitWithPatient = Prisma.VisitGetPayload<{
    include: { patient: true }
}>;

export default function TriageDashboardClient({ initialQueue }: { initialQueue: VisitWithPatient[] }) {
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<VisitWithPatient | null>(null);
    const [isPending, startTransition] = useTransition();
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const form = useForm<z.input<typeof triageFormSchema>>({
        resolver: zodResolver(triageFormSchema),
        defaultValues: {
            isManualEntry: false,
            firstName: "", lastName: "", dateOfBirth: "", gender: "Male",
            bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
            disposition: "NON-URGENT", priorityClass: "REGNEW",
            hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
        }
    });

    useEffect(() => {

        if (isManualEntry) {
            form.reset({
                isManualEntry: true,
                firstName: "", lastName: "", dateOfBirth: "", gender: "Male",
                bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                disposition: "NON-URGENT", priorityClass: "REGNEW",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
            });
        } else if (selectedPatient) {
            form.reset({
                isManualEntry: false,
                firstName: selectedPatient.patient.firstName,
                lastName: selectedPatient.patient.lastName,
                dateOfBirth: new Date(selectedPatient.patient.dateOfBirth).toISOString().split('T')[0],
                gender: selectedPatient.patient.gender,
                bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                disposition: "NON-URGENT", priorityClass: (selectedPatient.priorityClass as "REGNEW" | "REGOLD" | "PRIO") || "REGNEW",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false
            });
        } else {
            form.reset();
        }
    }, [isManualEntry, selectedPatient, form]);

    const onSubmit = (values: z.input<typeof triageFormSchema>) => {
        setSubmitError("");
        setSubmitSuccess(false);

        startTransition(async () => {
            const res = await submitTriageAction(values as TriageFormValues, selectedPatient?.id);
            if (res.error) {
                setSubmitError(res.error);
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
                                    <h3 className="font-bold text-slate-700 uppercase border-b pb-2">Patient Demographics</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name *</Label>
                                            <Input disabled={!isManualEntry} {...form.register("firstName")} />
                                            {form.formState.errors.firstName && <span className="text-red-500 text-xs">{form.formState.errors.firstName.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name *</Label>
                                            <Input disabled={!isManualEntry} {...form.register("lastName")} />
                                            {form.formState.errors.lastName && <span className="text-red-500 text-xs">{form.formState.errors.lastName.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Birth *</Label>
                                            <Input type="date" disabled={!isManualEntry} {...form.register("dateOfBirth")} />
                                            {form.formState.errors.dateOfBirth && <span className="text-red-500 text-xs">{form.formState.errors.dateOfBirth.message}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Gender *</Label>
                                            {isManualEntry ? (
                                                <Controller
                                                    control={form.control}
                                                    name="gender"
                                                    render={({ field }) => (
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Male">Male</SelectItem>
                                                                <SelectItem value="Female">Female</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                />
                                            ) : (
                                                <Input disabled value={form.getValues("gender") || ""} />
                                            )}
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
                                        <div className="w-48">
                                            <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority Class</Label>
                                            <Controller
                                                control={form.control}
                                                name="priorityClass"
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="REGNEW">Regular New</SelectItem>
                                                            <SelectItem value="REGOLD">Regular Old</SelectItem>
                                                            <SelectItem value="PRIO">Priority (PWD/Senior)</SelectItem>
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
                <div className="p-4 bg-emerald-900 border-b border-emerald-800 flex justify-between items-center">
                    <h2 className="font-bold text-white tracking-wide">WAITING FOR TRIAGE</h2>
                    <span className="bg-emerald-700 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {initialQueue.length}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 pointer-events-auto bg-slate-50">
                    {initialQueue.length === 0 ? (
                        <div className="text-center text-slate-400 p-8 text-sm font-medium">No patients in queue today.</div>
                    ) : (
                        initialQueue.map((visit) => (
                            <div
                                key={visit.id}
                                onClick={() => {
                                    if (!isManualEntry) {
                                        setSubmitError("");
                                        setSubmitSuccess(false);
                                        setSelectedPatient(visit);
                                    }
                                }}
                                className={`p-4 rounded-lg border cursor-pointer transition-all shadow-sm ${isManualEntry
                                    ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                                    : selectedPatient?.id === visit.id
                                        ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500/20"
                                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-900 uppercase tracking-tight text-sm">
                                        {visit.patient.lastName}, {visit.patient.firstName}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Queued
                                    </div>
                                    <div className="text-xs font-semibold text-slate-700">
                                        {new Date(visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    )
}
