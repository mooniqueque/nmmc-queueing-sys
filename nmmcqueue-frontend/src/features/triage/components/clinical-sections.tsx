"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Info, Notepad, WarningCircle } from "@phosphor-icons/react";
import { Controller, useFormContext } from "react-hook-form";
import { TriageFormInput } from "../schemas";

export function SymptomsSection() {
    const { control } = useFormContext<TriageFormInput>();

    const labels = {
        hasCough: "Cough",
        hasColds: "Colds",
        hasFever: "Fever",
        hasRashes: "Rashes",
        isInfectious: "Infectious"
    };

    return (
        <div className="bg-slate-100/60 p-6 rounded-xl border border-slate-300 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-300">
                <WarningCircle size={20} className="text-primary" weight="bold" />
                Symptoms & Alerts
            </h3>

            <div className="flex flex-wrap gap-3">
                {(['hasCough', 'hasColds', 'hasFever', 'hasRashes', 'isInfectious'] as const).map((symptom) => (
                    <Controller
                        key={symptom}
                        control={control}
                        name={symptom}
                        render={({ field }) => {
                            const isChecked = field.value as boolean;
                            return (
                                <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer ${isChecked
                                    ? "bg-white border-primary/40 shadow-sm"
                                    : "bg-white border-slate-300 hover:border-slate-400"
                                    }`}>
                                    <Switch
                                        id={symptom}
                                        checked={isChecked}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                    <Label htmlFor={symptom} className="flex items-center gap-2 text-lg font-semibold cursor-pointer text-slate-900">
                                        {labels[symptom]}
                                    </Label>
                                </div>
                            );
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

export function ClinicalNotesSection() {
    const { register, formState: { errors } } = useFormContext<TriageFormInput>();

    return (
        <div className="bg-slate-100/60 p-6 rounded-xl border border-slate-300 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-300">
                <Notepad size={20} className="text-primary" weight="bold" />
                Clinical Assessment
            </h3>

            <div className="space-y-6">


                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 pl-1">
                        Chief Complaint *
                    </Label>
                    <textarea
                        className="w-full flex min-h-22.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus-visible:outline-hidden focus:ring-2 focus:ring-primary/25 focus:border-primary/60 shadow-sm custom-scrollbar transition-all placeholder:text-slate-500"
                        placeholder="Detailed description of primary reason for visit..."
                        {...register("chiefComplaint")}
                    />
                    {errors.chiefComplaint && <span className="absolute -bottom-5 left-2 text-destructive text-[10px] font-bold uppercase tracking-widest">{errors.chiefComplaint.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 pl-1">
                            <Info size={17} weight="bold" className="text-slate-600" /> Medical History <span className="text-sm text-slate-600 font-medium normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-22.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus-visible:outline-hidden focus:ring-2 focus:ring-primary/25 focus:border-primary/60 shadow-sm custom-scrollbar transition-all placeholder:text-slate-500"
                            placeholder="Known allergies, previous illnesses..."
                            {...register("medicalHistory")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-lg font-semibold text-slate-900 pl-1">
                            <Notepad size={17} weight="bold" className="text-slate-600" /> Triage Remarks <span className="text-sm text-slate-600 font-medium normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-22.5 rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg font-medium text-slate-900 focus-visible:outline-hidden focus:ring-2 focus:ring-primary/25 focus:border-primary/60 shadow-sm custom-scrollbar transition-all placeholder:text-slate-500"
                            placeholder="Additional triage notes..."
                            {...register("triageRemarks")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
