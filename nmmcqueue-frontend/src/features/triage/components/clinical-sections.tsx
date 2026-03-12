"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Controller, useFormContext } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { WarningCircle, Wind, Virus, ThermometerHot, FirstAidKit, Syringe, Notepad, Info } from "@phosphor-icons/react";

export function SymptomsSection() {
    const { control } = useFormContext<TriageFormValues>();

    const icons = {
        hasCough: <Wind size={20} weight="duotone" className="text-amber-500" />,
        hasColds: <Virus size={20} weight="duotone" className="text-blue-500" />,
        hasFever: <ThermometerHot size={20} weight="duotone" className="text-rose-500" />,
        hasRashes: <FirstAidKit size={20} weight="duotone" className="text-pink-500" />,
        isInfectious: <Syringe size={20} weight="duotone" className="text-purple-500" />
    };

    const labels = {
        hasCough: "Cough",
        hasColds: "Colds",
        hasFever: "Fever",
        hasRashes: "Rashes",
        isInfectious: "Infectious"
    };

    return (
        <div className="bg-amber-50/50 p-6 rounded-[20px] border border-amber-100 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-amber-800 mb-6 pb-4 border-b border-amber-200/50">
                <WarningCircle size={22} className="text-amber-600" weight="fill" />
                Symptoms & Alerts
            </h3>
            
            <div className="flex flex-wrap gap-4">
                {(['hasCough', 'hasColds', 'hasFever', 'hasRashes', 'isInfectious'] as const).map((symptom) => (
                    <Controller
                        key={symptom}
                        control={control}
                        name={symptom}
                        render={({ field }) => {
                            const isChecked = field.value as boolean;
                            return (
                                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                    isChecked 
                                        ? "bg-white border-amber-400 shadow-md shadow-amber-500/10 scale-[1.02]" 
                                        : "bg-white/50 border-amber-200/50 hover:bg-white hover:border-amber-300"
                                }`}>
                                    <Switch 
                                        id={symptom}
                                        checked={isChecked} 
                                        onCheckedChange={field.onChange} 
                                        className={symptom === 'isInfectious' ? 'data-[state=checked]:bg-purple-600' : 'data-[state=checked]:bg-amber-500'}
                                    />
                                    <Label htmlFor={symptom} className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                                        {icons[symptom]}
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
    const { register, formState: { errors } } = useFormContext<TriageFormValues>();

    return (
        <div className="bg-slate-50/70 p-6 rounded-[20px] border border-slate-200/60 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800 mb-6 pb-4 border-b border-slate-200/60">
                <Notepad size={22} className="text-slate-600" weight="duotone" />
                Clinical Assessment
            </h3>
            
            <div className="space-y-6">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-xs font-black text-rose-600 uppercase tracking-widest pl-1">
                        Chief Complaint *
                    </Label>
                    <textarea
                        className="w-full flex min-h-[100px] rounded-2xl border-2 border-rose-100 bg-rose-50/30 px-5 py-4 text-base font-semibold focus-visible:outline-hidden focus:border-rose-400 focus:bg-white shadow-inner custom-scrollbar transition-all"
                        placeholder="Detailed description of primary reason for visit..."
                        {...register("chiefComplaint")}
                    />
                    {errors.chiefComplaint && <span className="absolute -bottom-5 left-2 text-rose-500 text-xs font-bold">{errors.chiefComplaint.message}</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            <Info size={16} weight="duotone" className="text-slate-400" /> Medical History <span className="text-[10px] text-slate-400 font-medium normal-case">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus:border-emerald-500 shadow-sm custom-scrollbar transition-all"
                            placeholder="Known allergies, previous illnesses..."
                            {...register("medicalHistory")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                            <Notepad size={16} weight="duotone" className="text-slate-400" /> Triage Remarks <span className="text-[10px] text-slate-400 font-medium normal-case">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus:border-emerald-500 shadow-sm custom-scrollbar transition-all"
                            placeholder="Additional triage notes..."
                            {...register("triageRemarks")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
