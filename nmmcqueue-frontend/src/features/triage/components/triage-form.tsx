"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { submitTriageForm } from "../actions";
import { triageFormSchema, TriageFormValues } from "../schemas";
import { ClipboardText, CaretDoubleRight, PaperPlaneRight, WarningCircle, Tag } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { getQueueOptions } from "@/features/shared/api";
import { PriorityCategory } from "@/types/models";

import { ClinicalNotesSection, SymptomsSection } from "./clinical-sections";
import { DemographicsSection } from "./demographics-section";
import { VitalsSection } from "./vitals-section";
import { useTriageStore } from "../store/use-triage-store";

export function TriageForm() {
    const {
        isManualEntry, setManualEntry,
        selectedPatient,
        submitError, setSubmitError,
        resetTriage
    } = useTriageStore();
    const [isPending, startTransition] = useTransition();
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<PriorityCategory[]>([]);

    useEffect(() => {
        getQueueOptions("TRIAGE").then(cats => setAvailableCategories(cats));
    }, []);

    const methods = useForm<z.input<typeof triageFormSchema>, unknown, TriageFormValues>({
        resolver: zodResolver(triageFormSchema),
        defaultValues: {
            isManualEntry: false,
            firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
            address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
            bloodPressure: "", chiefComplaint: "", medicalHistory: "", triageRemarks: "",
            hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
            priorityClass: "REGULAR",
            categoryIds: []
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
                priorityClass: "REGULAR",
                categoryIds: []
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
                priorityClass: selectedPatient.classification || "REGULAR",
                categoryIds: selectedPatient.categories?.map(c => c.categoryId) || []
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
                    resetTriage();
                    setSubmitSuccess(false);
                    methods.reset();
                }, 2000);
            }
        });
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">
            {/* Header Block */}
            <div className="bg-muted/30 border-b border-border pt-8 px-8 pb-6 flex justify-between items-end relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-bold text-foreground uppercase tracking-tight">Triage Assessment Form</h2>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1">
                        To be filled out by Triage Officer
                    </p>
                </div>

                <div className="relative z-10 flex items-center space-x-3 bg-background px-3 py-2 rounded-lg border border-border shadow-sm transition-all hover:shadow-md">
                    <Switch
                        id="manual-entry"
                        checked={isManualEntry}
                        onCheckedChange={(checked) => {
                            setSubmitError("");
                            setSubmitSuccess(false);
                            setManualEntry(checked);
                        }}
                        className="data-[state=checked]:bg-primary shadow-inner"
                    />
                    <Label htmlFor="manual-entry" className="font-bold text-xs text-foreground cursor-pointer select-none uppercase tracking-wider">
                        Manual Entry
                    </Label>
                </div>
            </div>

            <div className="p-8">
                {(!isManualEntry && !selectedPatient) ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
                        <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center shadow-sm border border-border mb-6">
                            <CaretDoubleRight size={28} weight="bold" className="text-muted/30" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1">Select a Patient</h3>
                        <p className="text-[10px] font-medium uppercase tracking-widest">Click a patient from the list, or toggle Manual Entry.</p>
                    </div>
                ) : (
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-0 relative">
                            {/* The inner sections handle their own top margins for a masonry/stack effect */}
                            <DemographicsSection isManualEntry={isManualEntry} hasSelectedPatient={!!selectedPatient} />
                            <VitalsSection />
                            <SymptomsSection />
                            <ClinicalNotesSection />

                             {/* Submission Footer */}
                             <div className="mt-12 bg-muted/10 p-6 rounded-xl flex items-center justify-between border border-border shadow-sm">
                                <div className="flex gap-4">
                                    <div className="w-48">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block pl-1">
                                            Acuity / Disposition
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="disposition"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                                    <SelectTrigger className="h-10 rounded-lg border-border bg-background text-xs font-bold transition-all focus:ring-primary/20">
                                                        <SelectValue placeholder="Select Acuity..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-border bg-background">
                                                        <SelectItem value="NON-URGENT" className="font-bold py-2 text-xs">Non-Urgent</SelectItem>
                                                        <SelectItem value="URGENT" className="font-bold py-2 text-xs text-amber-600">Urgent</SelectItem>
                                                        <SelectItem value="EMERGENT" className="font-bold py-2 text-xs text-destructive">Emergent (Critical)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[140px]">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block pl-1">
                                            Classification
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="priorityClass"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className={`h-10 rounded-lg border-border bg-background text-xs font-bold transition-all focus:ring-primary/20 ${field.value === "PRIORITY" ? "text-primary border-primary/30 ring-1 ring-primary/10" : "text-foreground"}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-lg border-border bg-background">
                                                        <SelectItem value="REGULAR" className="font-bold py-2 text-xs">Regular</SelectItem>
                                                        <SelectItem value="PRIORITY" className="font-bold py-2 text-xs text-primary">Priority</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                {availableCategories.length > 0 && (
                                    <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Tag size={16} weight="bold" className="text-primary" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority Categories</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableCategories.map(cat => (
                                                <div key={cat.id} className="flex items-center space-x-2 bg-background p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all shadow-sm">
                                                    <Controller
                                                        control={methods.control}
                                                        name="categoryIds"
                                                        render={({ field }) => (
                                                            <Checkbox
                                                                id={`triage-cat-${cat.id}`}
                                                                checked={field.value?.includes(cat.id)}
                                                                onCheckedChange={(checked: boolean) => {
                                                                    const current = field.value || [];
                                                                    const next = checked
                                                                        ? [...current, cat.id]
                                                                        : current.filter(id => id !== cat.id);
                                                                    field.onChange(next);
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                    <label htmlFor={`triage-cat-${cat.id}`} className="text-[11px] font-bold text-foreground cursor-pointer uppercase tracking-tight">
                                                        {cat.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col items-end justify-center min-w-[200px]">
                                    {submitError && (
                                        <span className="flex items-center gap-1.5 text-destructive text-[11px] font-bold mb-3 absolute -top-8 right-0 bg-destructive/10 px-4 py-2 rounded-lg border border-destructive/20 uppercase tracking-widest animate-in slide-in-from-bottom-2">
                                            <WarningCircle size={14} weight="bold" /> {submitError}
                                        </span>
                                    )}
                                    {submitSuccess && (
                                        <span className="flex items-center gap-1.5 text-primary text-[11px] font-bold mb-3 absolute -top-8 right-0 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 uppercase tracking-widest animate-in slide-in-from-bottom-2">
                                            Assessment Completed!
                                        </span>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className={`h-11 w-full px-6 text-xs tracking-widest uppercase font-bold transition-all rounded-xl shadow-md ${isPending || submitSuccess
                                            ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 active:scale-[0.98]"
                                            }`}
                                    >
                                        {isPending ? "Processing..." : (
                                            <span className="flex items-center gap-2">
                                                Complete Assessment <PaperPlaneRight size={18} weight="bold" />
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                )}
            </div>
        </div>
    );
}
