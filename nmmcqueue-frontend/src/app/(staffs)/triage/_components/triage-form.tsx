"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { submitTriageForm } from "../_actions/triage-actions";
import { triageFormSchema, TriageFormValues } from "../_schemas/triage-schema";
import { VisitWithPatient } from "../_types";

import { ClinicalNotesSection, SymptomsSection } from "./clinical-sections";
import { DemographicsSection } from "./demographics-section";
import { VitalsSection } from "./vitals-section";

interface TriageFormProps {
    isManualEntry: boolean;
    setIsManualEntry: (val: boolean) => void;
    selectedPatient: VisitWithPatient | null;
    setSelectedPatient: (val: VisitWithPatient | null) => void;
    submitError: string;
    setSubmitError: (val: string) => void;
}

export function TriageForm({
    isManualEntry,
    setIsManualEntry,
    selectedPatient,
    setSelectedPatient,
    submitError,
    setSubmitError
}: TriageFormProps) {
    const [isPending, startTransition] = useTransition();
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const methods = useForm<z.input<typeof triageFormSchema>, unknown, TriageFormValues>({
        resolver: zodResolver(triageFormSchema),
        defaultValues: {
            isManualEntry: false,
            firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
            address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
            bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
            hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
            priorityClass: "REGNEW"
        }
    });

    useEffect(() => {
        if (isManualEntry) {
            methods.reset({
                isManualEntry: true,
                firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
                address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
                bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
                priorityClass: "REGNEW"
            });
        } else if (selectedPatient) {
            methods.reset({
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
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
                priorityClass: "REGNEW"
            });
        } else {
            methods.reset();
        }
    }, [isManualEntry, selectedPatient, methods]);

    const onSubmit = (values: TriageFormValues) => {
        setSubmitError("");
        setSubmitSuccess(false);

        startTransition(async () => {
            const res = await submitTriageForm(values, selectedPatient?.id);
            if (res?.error) {
                setSubmitError(res.error as string);
            } else {
                setSubmitSuccess(true);
                setTimeout(() => {
                    setIsManualEntry(false);
                    setSelectedPatient(null);
                    setSubmitSuccess(false);
                    methods.reset();
                }, 2000);
            }
        });
    };

    return (
        <Card className="shadow-lg border-t-4 border-t-emerald-600">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold text-emerald-900">TRIAGE ASSESSMENT FORM</CardTitle>
                        <CardDescription className="text-emerald-700 font-medium mt-1">
                            TO BE FILLED OUT BY TRIAGE OFFICER
                        </CardDescription>
                    </div>

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
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
                            <DemographicsSection isManualEntry={isManualEntry} hasSelectedPatient={!!selectedPatient} />
                            <VitalsSection />
                            <SymptomsSection />
                            <ClinicalNotesSection />

                            <div className="flex items-center justify-between border-t pt-6">
                                <div className="flex gap-4">
                                    <div className="w-48">
                                        <Label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Acuity / Disposition</Label>
                                        <Controller
                                            control={methods.control}
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
                                        <Label className="text-xs font-bold text-slate-500 upercase mb-1 block">Patient Priority </Label>
                                        <Controller
                                            control={methods.control}
                                            name="priorityClass"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="REGULAR"> Regular </SelectItem>
                                                        <SelectItem value="PRIORITY"> Priority </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )
                                            }
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
                    </FormProvider>
                )}
            </CardContent>
        </Card>
    );
}
