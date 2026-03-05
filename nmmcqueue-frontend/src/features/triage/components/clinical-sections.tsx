"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Controller, useFormContext } from "react-hook-form";
import { TriageFormValues } from "../schemas";

export function SymptomsSection() {
    const { control } = useFormContext<TriageFormValues>();

    return (
        <div className="p-5 bg-amber-50/50 rounded-lg border border-amber-100 space-y-4">
            <h3 className="font-bold text-slate-700 uppercase border-b border-amber-200 pb-2">Symptoms & Alerts</h3>
            <div className="flex flex-wrap gap-6">
                {(['hasCough', 'hasColds', 'hasFever', 'hasRashes', 'isInfectious'] as const).map((symptom) => (
                    <Controller
                        key={symptom}
                        control={control}
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
    );
}

export function ClinicalNotesSection() {
    const { register, formState: { errors } } = useFormContext<TriageFormValues>();

    return (
        <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-700 uppercase border-b pb-2">Clinical Assessment</h3>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="font-semibold text-red-600">Chief Complaint *</Label>
                    <textarea
                        className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                        placeholder="Primary reason for visit..."
                        {...register("chiefComplaint")}
                    />
                    {errors.chiefComplaint && <span className="text-red-500 text-xs">{errors.chiefComplaint.message}</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Medical History (Optional)</Label>
                        <textarea
                            className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                            {...register("medicalHistory")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Triage Remarks (Optional)</Label>
                        <textarea
                            className="w-full flex min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-950"
                            {...register("triageRemarks")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
