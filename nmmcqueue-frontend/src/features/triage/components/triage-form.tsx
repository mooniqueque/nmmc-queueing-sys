"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getDepartments, getQueueOptions } from "@/features/shared/api";
import { notify } from "@/shared/lib/notify";
import { Department, DepartmentStatus, PriorityCategory, VisitPriorityCategory } from "@/shared/types/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaretDoubleRight, Printer, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { submitTriageForm } from "../actions";
import { TriageFormInput, TriageFormValues, triageFormSchema } from "../schemas";

import { useTriageDraftStore } from "../store/use-triage-draft-store";
import { useTriageStore } from "../store/use-triage-store";
import { ClinicalNotesSection, SymptomsSection } from "./clinical-sections";
import { DemographicsSection } from "./demographics-section";
import { VitalsSection } from "./vitals-section";

interface TriageFormProps {
    availableDepartments?: Department[];
}

function getClassificationDisplayLabel(category: PriorityCategory) {
    const knownLabels: Record<string, string> = {
        REG: "Regular",
        PWD: "Person with Disability",
        SNR: "Senior Citizen",
        PREG: "Pregnant",
        "ER-REF": "ER-Referral",
    };

    const code = category.code?.trim().toUpperCase() || "";
    const label = knownLabels[code] || category.name || code;
    return `${label} (${code})`;
}

export function TriageForm({ availableDepartments }: TriageFormProps) {
    const {
        isManualEntry,
        selectedPatient,
        submitError, setSubmitError,
        resetTriage
    } = useTriageStore();
    const { saveDraft, clearDraft, getDraft } = useTriageDraftStore();
    const [isPending, startTransition] = useTransition();
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [availableCategories, setAvailableCategories] = useState<PriorityCategory[]>([]);
    const [departments, setDepartments] = useState<Department[]>(availableDepartments ?? []);
    const [printErrorDialog, setPrintErrorDialog] = useState<{ open: boolean; error: string }>({ open: false, error: "" });
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (availableDepartments !== undefined) {
            const filtered = availableDepartments.filter((dept) => dept.status !== DepartmentStatus.CLOSED);
            queueMicrotask(() => setDepartments(filtered));
            return;
        }

        getDepartments().then(res => {
            if (res.data) {
                setDepartments(res.data.filter((d: Department) =>
                    d.status !== DepartmentStatus.CLOSED &&
                    !d.name.toLowerCase().includes('admin') &&
                    !d.name.toLowerCase().includes('triage') &&
                    !d.name.toLowerCase().includes('window')
                ));
            }
        });
    }, [availableDepartments]);

    const methods = useForm<TriageFormInput, unknown, TriageFormValues>({
        resolver: zodResolver(triageFormSchema),
        defaultValues: {
            isManualEntry: false,
            firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
            address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
            bloodPressure: "", bloodPressureNA: false,
            heartRate: "", heartRateNA: false,
            respiratoryRate: "", respiratoryRateNA: false,
            temperature: "", temperatureNA: false,
            oxygenSat: "", oxygenSatNA: false,
            chiefComplaint: "", medicalHistory: "", triageRemarks: "",
            hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
            priorityClass: "REGULAR",
            queueOptionId: "",
            departmentId: "",
            disposition: "",
            categoryIds: []
        }
    });

    const selectedDepartmentId = methods.watch("departmentId");
    const selectedQueueOptionId = methods.watch("queueOptionId");
    const selectedOption = availableCategories.find((category) => category.id === selectedQueueOptionId);

    const acuityOptions = [
        { value: "NON-URGENT", label: "Non-Urgent" },
        { value: "URGENT", label: "Urgent" },
        { value: "EMERGENT", label: "Emergent (Critical)" },
    ];

    const classificationOptions = availableCategories.map((category) => ({
        value: category.id,
        label: getClassificationDisplayLabel(category),
    }));

    useEffect(() => {
        if (isManualEntry) {
            const walkInDefaults: TriageFormInput = {
                isManualEntry: true,
                firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "Male",
                address: "", birthPlace: "", religion: "", civilStatus: "Single", hasAppointment: false,
                bloodPressure: "", bloodPressureNA: false,
                heartRate: "", heartRateNA: false,
                respiratoryRate: "", respiratoryRateNA: false,
                temperature: "", temperatureNA: false,
                oxygenSat: "", oxygenSatNA: false,
                chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
                priorityClass: "REGULAR",
                queueOptionId: "",
                departmentId: "",
                disposition: "", // Will be validated on submit
                categoryIds: []
            };
            // Restore draft if one exists for this walk-in session
            const draft = getDraft(null);
            methods.reset(draft ? { ...walkInDefaults, ...draft } : walkInDefaults);
        } else if (selectedPatient) {
            const patientDefaults: TriageFormInput = {
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
                bloodPressure: "", bloodPressureNA: false,
                heartRate: "", heartRateNA: false,
                respiratoryRate: "", respiratoryRateNA: false,
                temperature: "", temperatureNA: false,
                oxygenSat: "", oxygenSatNA: false,
                chiefComplaint: "", medicalHistory: "", triageRemarks: "",
                hasColds: false, hasCough: false, hasFever: false, hasRashes: false, isInfectious: false,
                priorityClass: selectedPatient.classification || "REGULAR",
                queueOptionId: selectedPatient.categories?.[0]?.categoryId || "",
                departmentId: "",
                disposition: "",
                categoryIds: selectedPatient.categories?.map((c: VisitPriorityCategory) => c.categoryId) || []
            };
            // Restore draft if one exists for this specific patient
            const draft = getDraft(selectedPatient.id);
            methods.reset(draft ? { ...patientDefaults, ...draft } : patientDefaults);
        } else {
            methods.reset();
        }
    }, [isManualEntry, selectedPatient, methods, getDraft]);

    // Auto-save form state to localStorage (debounced)
    useEffect(() => {
        const subscription = methods.watch((values) => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                const currentVisitId = selectedPatient?.id ?? null;
                saveDraft(values as Partial<TriageFormInput>, currentVisitId);
            }, 500);
        });
        return () => {
            subscription.unsubscribe();
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [methods, selectedPatient, saveDraft]);

    useEffect(() => {
        if (!selectedDepartmentId) {
            setAvailableCategories([]);
            methods.setValue("queueOptionId", "");
            methods.setValue("categoryIds", []);
            methods.setValue("priorityClass", "REGULAR");
            return;
        }

        const selectedDepartment = departments.find((department) => department.id === selectedDepartmentId);
        if (!selectedDepartment) return;

        getQueueOptions(selectedDepartment.name)
            .then((cats) => {
                const queueOptions = Array.isArray(cats) ? cats : [];
                setAvailableCategories(queueOptions);
            })
            .catch(() => {
                setAvailableCategories([]);
            });
    }, [selectedDepartmentId, departments, methods]);

    useEffect(() => {
        if (availableCategories.length === 0) return;

        const activeOption = availableCategories.find((category) => category.id === selectedQueueOptionId);
        if (activeOption) {
            methods.setValue("priorityClass", activeOption.isPriority ? "PRIORITY" : "REGULAR");
            methods.setValue("categoryIds", [activeOption.id]);
            return;
        }

        const regularOption = availableCategories.find((category) => category.code.trim().toUpperCase() === "REGULAR");
        const defaultOption = regularOption ?? availableCategories[0];
        methods.setValue("queueOptionId", defaultOption.id);
        methods.setValue("priorityClass", defaultOption.isPriority ? "PRIORITY" : "REGULAR");
        methods.setValue("categoryIds", [defaultOption.id]);
    }, [availableCategories, selectedQueueOptionId, methods]);

    const onSubmit = (values: TriageFormValues) => {
        setSubmitError("");
        setSubmitSuccess(false);

        const selectedOption = availableCategories.find((category) => category.id === values.queueOptionId);
        const payload: TriageFormValues = {
            ...values,
            priorityClass: selectedOption ? (selectedOption.isPriority ? "PRIORITY" : "REGULAR") : values.priorityClass,
            categoryIds: selectedOption ? [selectedOption.id] : [],
        };

        startTransition(async () => {
            const res = await submitTriageForm(payload, selectedPatient?.id);
            if (res?.error) {
                setSubmitError(res.error as string);
            } else {
                // Check for printer error in response
                if (res?.printError) {
                    setPrintErrorDialog({ open: true, error: res.printError });
                    // Still mark as success since triage submission succeeded
                    setSubmitSuccess(true);
                } else {
                    setSubmitSuccess(true);
                }

                notify.success("Patient is Successfully Queued For Window Processing");

                clearDraft();
                resetTriage();
                setTimeout(() => {
                    setSubmitSuccess(false);
                    methods.reset();
                }, 2000);
            }
        });
    };

    const handleInvalid = (errors: Record<string, { message?: string }>) => {
        const bpError = errors.bloodPressure?.message;
        if (bpError) {
            notify.error("Invalid BP format", {
                description: "Use SYSTOLIC/DIASTOLIC, e.g., 120/80.",
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
            {/* Header Block */}
            {!isManualEntry && (
                <div className="bg-slate-50 border-b border-slate-100 pt-8 px-8 pb-6 flex justify-between items-end relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-lg blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-m font-bold text-slate-900 uppercase tracking-tight">Triage Assessment Form</h2>
                        </div>
                        <p className="text-sm font-medium text-slate-400 tracking-widest">
                            To be filled out by Triage Officer
                        </p>
                    </div>
                </div>
            )}

            <div className="p-8">
                {(!isManualEntry && !selectedPatient) ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-4xl border border-slate-200 border-dashed">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                            <CaretDoubleRight size={32} weight="duotone" className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-800 mb-2">Call Next Patient</h3>
                        <p className="text-sm font-medium text-slate-500">Click <strong>CALL NEXT</strong> to automatically call Waiting List on the right or toggle Manual Entry above.</p>
                    </div>
                ) : (
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit, handleInvalid)} className="space-y-0 relative">
                            {/* The inner sections handle their own top margins for a masonry/stack effect */}
                            <DemographicsSection />
                            <VitalsSection />
                            <SymptomsSection />
                            <ClinicalNotesSection />

                                {/* Submission Footer */}
                            <div className=" mt-8 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="flex-1">
                                        <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1 mb-2 block">
                                            Acuity / Disposition *
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="disposition"
                                            render={({ field }) => (
                                                <div className="relative">
                                                    <SearchableSelect
                                                        options={acuityOptions}
                                                        value={field.value}
                                                        onSelect={field.onChange}
                                                        placeholder="Select Acuity"
                                                        searchPlaceholder="Search acuity..."
                                                        emptyMessage="No acuity found."
                                                        className={`h-12 text-xl font-semibold ${methods.formState.errors.disposition ? 'border-destructive ring-1 ring-destructive/20 text-destructive' : field.value === "EMERGENT" ? "text-slate-800 border-slate-500/50 ring-2 ring-slate-500/20" : field.value === "URGENT" ? "text-slate-800 border-amber-500/50 ring-2 ring-amber-500/20" : "border-slate-300 text-slate-800"}`}
                                                    />
                                                {methods.formState.errors.disposition && <span className="text-destructive text-[10px] font-bold uppercase tracking-widest mt-1 absolute block">{methods.formState.errors.disposition.message}</span>}
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1 mb-2 block">
                                            Clinical Department *
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="departmentId"
                                            render={({ field }) => (
                                                <div className="relative">
                                                    <SearchableSelect
                                                        options={departments.map(dept => ({ label: dept.name, value: dept.id }))}
                                                        value={field.value}
                                                        onSelect={field.onChange}
                                                        placeholder="Select Department"
                                                        searchPlaceholder="Search department..."
                                                        emptyMessage={departments.length === 0 ? "No enabled department available." : "No department found."}
                                                        className={`h-11 text-lg font-semibold text-gray-900 ${methods.formState.errors.departmentId ? 'border-destructive ring-1 ring-destructive/20 text-destructive' : 'text-slate-800'}`}
                                                    />
                                                    {methods.formState.errors.departmentId && <span className="text-destructive text-[10px] font-bold uppercase tracking-widest mt-1 absolute block">{methods.formState.errors.departmentId.message}</span>}
                                                </div>
                                                
                                            )}
                                        />
                                        {departments.length === 0 && (
                                            <p className="mt-3 ml-4 mb-2 text-xs font-semibold uppercase tracking-widest text-amber-600">
                                                No enabled departments assigned for this user. 
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Label className="text-base font-bold text-gray-800 uppercase tracking-wide pl-1 mb-2 block">
                                            Patient Classification *
                                        </Label>
                                        <Controller
                                            control={methods.control}
                                            name="queueOptionId"
                                            render={({ field }) => (
                                                <SearchableSelect
                                                    options={classificationOptions}
                                                    value={field.value}
                                                    onSelect={(value) => {
                                                        const option = availableCategories.find((category) => category.id === value);
                                                        field.onChange(value);
                                                        methods.setValue("priorityClass", option?.isPriority ? "PRIORITY" : "REGULAR", { shouldValidate: true });
                                                        methods.setValue("categoryIds", option ? [option.id] : [], { shouldValidate: true });
                                                    }}
                                                    placeholder={methods.watch("departmentId") ? "Select Classification" : "Select Department First"}
                                                    searchPlaceholder="Search classification..."
                                                    emptyMessage={methods.watch("departmentId") ? "No classification available." : "Select department first."}
                                                    disabled={!methods.watch("departmentId") || availableCategories.length === 0}
                                                    className={`h-12 text-xl font-semibold border border-slate-300 ${selectedOption?.isPriority ? "text-emerald-600 ring-1 ring-emerald-500/50 border-emerald-500/50" : "text-slate-800"}`}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

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

                                    <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">

                                        <Button
                                            type="submit"
                                            disabled={isPending || submitSuccess}
                                            className={`h-12 px-6 mt-6 w-full sm:w-auto text-[15px] tracking-widest shadow-xl uppercase font-black transition-all rounded-xl ${isPending || submitSuccess
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:-translate-y-1 hover:shadow-emerald-500/10"
                                                }`}
                                        >
                                            {isPending ? "Submitting..." : (
                                                <span className="flex items-center gap-2">
                                                    SUBMIT <Printer size={22} weight="fill" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </FormProvider>
                )}
            </div>

            {/* Printer Error Dialog */}
            <Dialog open={printErrorDialog.open} onOpenChange={(open) => setPrintErrorDialog({ ...printErrorDialog, open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-900">Printer Unavailable</DialogTitle>
                        <DialogDescription className="text-slate-600 mt-2">
                            The ticket printer is not available or offline. The patient has been successfully triaged and can proceed to the window.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
                        <p className="text-xs font-mono text-red-700">{printErrorDialog.error}</p>
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPrintErrorDialog({ open: false, error: "" })}
                            className="flex-1"
                        >
                            Dismiss
                        </Button>
                        <Button
                            onClick={() => setPrintErrorDialog({ open: false, error: "" })}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
