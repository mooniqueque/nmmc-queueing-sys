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
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
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
                                    ? "bg-background border-primary/30 shadow-sm"
                                    : "bg-background/50 border-border hover:border-border/80"
                                    }`}>
                                    <Switch
                                        id={symptom}
                                        checked={isChecked}
                                        onCheckedChange={field.onChange}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                    <Label htmlFor={symptom} className="flex items-center gap-2 text-base font-bold cursor-pointer text-gray-800 uppercase tracking-wide">
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
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
                <Notepad size={20} className="text-primary" weight="bold" />
                Clinical Assessment
            </h3>

            <div className="space-y-6">


                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                        Chief Complaint *
                    </Label>
                    <textarea
                        className="w-full flex min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold text-gray-900 focus-visible:outline-hidden focus:ring-1 focus:ring-primary/20 focus:border-primary/50 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                        placeholder="Detailed description of primary reason for visit..."
                        {...register("chiefComplaint")}
                    />
                    {errors.chiefComplaint && <span className="absolute -bottom-5 left-2 text-destructive text-[10px] font-bold uppercase tracking-widest">{errors.chiefComplaint.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                            <Info size={16} weight="bold" className="text-muted-foreground/80" /> Medical History <span className="text-xs text-muted-foreground/60 font-semibold normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold text-gray-900 focus-visible:outline-hidden focus:ring-1 focus:ring-primary/20 focus:border-primary/50 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                            placeholder="Known allergies, previous illnesses..."
                            {...register("medicalHistory")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-base font-bold text-gray-800 uppercase tracking-wide pl-1">
                            <Notepad size={16} weight="bold" className="text-muted-foreground/80" /> Triage Remarks <span className="text-xs text-muted-foreground/60 font-semibold normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold text-gray-900 focus-visible:outline-hidden focus:ring-1 focus:ring-primary/20 focus:border-primary/50 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                            placeholder="Additional triage notes..."
                            {...register("triageRemarks")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
