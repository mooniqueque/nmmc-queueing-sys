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
import { CaretDoubleRight, Printer, WarningCircle, Tag, CaretDown, Check } from "@phosphor-icons/react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { getQueueOptions, getDepartments } from "@/features/shared/api";
import { PriorityCategory, Department } from "@/types/models";

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
    const [departments, setDepartments] = useState<Department[]>([]);

    useEffect(() => {
        getQueueOptions("TRIAGE").then(cats => setAvailableCategories(cats));
        getDepartments().then(res => {
            if (res.data) {
                setDepartments(res.data.filter((d: Department) => !d.name.toLowerCase().includes('admin') && !d.name.toLowerCase().includes('triage') && !d.name.toLowerCase().includes('window')));
            }
        });
    }, []);

    const methods = useForm<z.input<typeof triageFormSchema>, unknown, TriageFormValues>({
        resolver: zodResolver(triageFormSchema as any),
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
                categoryIds: selectedPatient.categories?.map((c: any) => c.categoryId) || []
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

                // Auto-print triage ticket handled by backend

                setTimeout(() => {
                    resetTriage();
                    setSubmitSuccess(false);
                    methods.reset();
                }, 2000);
            }
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
            {/* Header Block */}
            <div className="bg-slate-50 border-b border-slate-200 pt-8 px-8 pb-6 flex justify-between items-end relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-lg blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-m font-bold text-slate-900 uppercase tracking-tight">Triage Assessment Form</h2>
                    </div>
                    <p className="text-sm font-medium text-slate-400 tracking-widest">
                        To be filled out by Triage Officer
                    </p>
                </div>

                <div className="relative z-0 flex items-center space-x-3 bg-white px-2 py-2 rounded-lg shadow-sm border border-slate-200 transition-all hover:shadow-md">
                    <Switch
                        id="manual-entry"
                        checked={isManualEntry}
                        onCheckedChange={(checked) => {
                            setSubmitError("");
                            setSubmitSuccess(false);
                            setManualEntry(checked);
                        }}
                        className="data-[state=checked]:bg-emerald-600 shadow-inner"
                    />
                    <Label htmlFor="manual-entry" className="font-bold text-[15px] text-slate-700 cursor-pointer select-none">
                        Walk-in / Manual Entry
                    </Label>
                </div>
            </div>

            <div className="p-8">
                {(!isManualEntry && !selectedPatient) ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-[20px] border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                            <CaretDoubleRight size={32} weight="duotone" className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Patient</h3>
                        <p className="text-sm font-medium">Click a patient from the Waiting List on the right, or toggle Manual Entry above.</p>
                    </div>
                ) : (
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-0 relative">
                            {/* The inner sections handle their own top margins for a masonry/stack effect */}
                            <DemographicsSection />
                            <VitalsSection />
                            <SymptomsSection />
                            <ClinicalNotesSection />

                                {/* Submission Footer */}
                            <div className=" mt-8 bg-slate-50/70 p-6 rounded-xl border border-slate-200/60 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="flex-1">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">
                                            Acuity / Disposition *
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="disposition"
                                            render={({ field }) => (
                                                <div className="relative">
                                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                                    <SelectTrigger className={`h-11 rounded-xl bg-white text-sm font-bold transition-all border ${methods.formState.errors.disposition ? 'border-destructive ring-1 ring-destructive/20' : field.value === "EMERGENT" ? "text-slate-800 border-slate-500/50 ring-2 ring-slate-500/20" : field.value === "URGENT" ? "text-slate-800 border-amber-500/50 ring-2 ring-amber-500/20" : "border-slate-300 text-slate-800"}`}>
                                                        <SelectValue placeholder="Select Acuity" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-2xl border-slate-300 bg-white">
                                                        <SelectItem value="NON-URGENT" className="font-bold py-2 focus:bg-slate-100 text-slate-800">Non-Urgent</SelectItem>
                                                        <SelectItem value="URGENT" className="font-bold py-2 focus:bg-slate-100 text-slate-800">Urgent</SelectItem>
                                                        <SelectItem value="EMERGENT" className="font-bold py-2 focus:bg-slate-100 text-slate-800">Emergent (Critical)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {methods.formState.errors.disposition && <span className="text-destructive text-[10px] font-bold uppercase tracking-widest mt-1 absolute block">{methods.formState.errors.disposition.message}</span>}
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">
                                            Patient Classification
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="priorityClass"
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className={`h-11 rounded-xl bg-white text-sm font-bold transition-all border border-slate-300 ${field.value === "PRIORITY" ? "text-emerald-600 ring-1 ring-emerald-500/50 border-emerald-500/50" : "text-slate-800"}`}>
                                                        <SelectValue placeholder="Select Classification" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-2xl border-slate-300 bg-white">
                                                        <SelectItem value="REGULAR" className="font-bold py-2 focus:bg-slate-100 text-slate-800">Regular</SelectItem>
                                                        <SelectItem value="PRIORITY" className="font-bold py-2 focus:bg-slate-100 text-emerald-600">Priority</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">
                                            Clinical Department *
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="departmentId"
                                            render={({ field }) => (
                                                <div className="relative">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            role="combobox"
                                                            className={`flex items-center justify-between w-full h-11 px-3 rounded-xl bg-white text-sm font-bold transition-all border ${methods.formState.errors.departmentId ? 'border-destructive ring-1 ring-destructive/20 text-destructive' : 'border-slate-300 text-slate-800'}`}
                                                        >
                                                            {field.value
                                                                ? departments.find((dept) => dept.id === field.value)?.name || "Select Department"
                                                                : <span className="font-normal text-slate-500 opacity-80">Select Department</span>}
                                                            <CaretDown className="h-4 w-4 opacity-50" />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0 rounded-xl border-slate-300 shadow-2xl bg-white" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search department..." className="h-11 font-medium" />
                                                            <CommandList className="max-h-[200px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                                                <CommandEmpty className="py-4 text-center text-sm font-medium text-slate-500">No department found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {departments.map((dept) => (
                                                                        <CommandItem
                                                                            key={dept.id}
                                                                            value={dept.name}
                                                                            onSelect={() => {
                                                                                field.onChange(dept.id);
                                                                                // The Shadcn Command trigger doesn't auto close by default on raw select sometimes without ref or popover state hook, but typically it will just update
                                                                            }}
                                                                            className="font-bold py-2 cursor-pointer data-[selected=true]:bg-slate-100 text-slate-800"
                                                                        >
                                                                            <Check className={`mr-2 h-4 w-4 ${field.value === dept.id ? "opacity-100" : "opacity-0"}`} />
                                                                            {dept.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {methods.formState.errors.departmentId && <span className="text-destructive text-[10px] font-bold uppercase tracking-widest mt-1 absolute block">{methods.formState.errors.departmentId.message}</span>}
                                                </div>
                                            )}
                                        />
                                    </div>
                                </div>

                                {availableCategories.length > 0 && (
                                    <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag size={18} weight="duotone" className="text-emerald-400" />
                                            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Priority Tags / Categories</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {availableCategories.map(cat => (
                                                <div key={cat.id} className="flex items-center space-x-2 bg-slate-700/50 p-2 rounded-lg border border-slate-600/50 hover:border-emerald-500/50 transition-colors">
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
                                                    <label htmlFor={`triage-cat-${cat.id}`} className="text-xs font-bold text-slate-200 cursor-pointer">
                                                        {cat.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col items-end justify-center">
                                    {submitError && (
                                        <span className={`flex items-center gap-1.5 text-[11px] font-bold mb-3 absolute -top-8 right-0 px-4 py-2 rounded-lg border uppercase tracking-widest animate-in slide-in-from-bottom-2 ${submitError.includes('Hardware Print') ? 'bg-red-500 text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-destructive bg-destructive/10 border-destructive/20'}`}>
                                            <WarningCircle size={14} weight="bold" /> {submitError}
                                        </span>
                                    )}
                                    {submitSuccess && (
                                        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold mb-3 absolute -top-8 right-0 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                                            Triage Assessment Completed!
                                        </span>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isPending}
                                        className={`h-12 px-6 mt-6 w-full sm:w-auto text-[15px] tracking-widest shadow-xl uppercase font-black transition-all rounded-xl ${isPending || submitSuccess
                                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                            : "bg-emerald-500 hover:bg-emerald-400 text-white hover:-translate-y-1 hover:shadow-emerald-500/25"
                                            }`}
                                    >
                                        {isPending ? "Submitting..." : (
                                            <span className="flex items-center gap-2">
                                                Print Ticket & Send <Printer size={22} weight="fill" />
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
