"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller, useFormContext } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { WarningCircle, Wind, Virus, ThermometerHot, FirstAidKit, Syringe, Notepad, Info, Stethoscope } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import * as departmentApi from "@/lib/api/departments";

export function SymptomsSection() {
    const { control } = useFormContext<TriageFormValues>();

    const labels = {
        hasCough: "Cough",
        hasColds: "Colds",
        hasFever: "Fever",
        hasRashes: "Rashes",
        isInfectious: "Infectious"
    };

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
                <WarningCircle size={18} className="text-primary" weight="bold" />
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
                                    <Label htmlFor={symptom} className="flex items-center gap-2 text-[11px] font-bold cursor-pointer text-foreground uppercase tracking-tight">
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
    const { register, control, formState: { errors } } = useFormContext<TriageFormValues>();
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
    const [loadingDepts, setLoadingDepts] = useState(true);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const depts = await departmentApi.getAllDepartments();
                setDepartments(depts);
            } catch (err) {
                console.error("Failed to fetch departments:", err);
            } finally {
                setLoadingDepts(false);
            }
        };
        fetchDepartments();
    }, []);

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
                <Notepad size={18} className="text-primary" weight="bold" />
                Clinical Assessment
            </h3>

            <div className="space-y-6">
                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Stethoscope size={14} weight="bold" className="text-muted-foreground/60" /> Referral Department *
                    </Label>
                    <Controller
                        control={control}
                        name="departmentId"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <SelectTrigger className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50">
                                    <SelectValue placeholder={loadingDepts ? "Loading departments..." : "Select Department"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg border-border bg-background">
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id} className="text-xs font-bold py-2">
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.departmentId && <span className="absolute -bottom-5 left-2 text-destructive text-[10px] font-bold uppercase tracking-widest">{errors.departmentId.message}</span>}
                </div>

                <div className="space-y-2 relative">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        Chief Complaint *
                    </Label>
                    <textarea
                        className="w-full flex min-h-[100px] rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium focus-visible:outline-hidden focus:border-primary/50 focus:ring-1 focus:ring-primary/20 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                        placeholder="Detailed description of primary reason for visit..."
                        {...register("chiefComplaint")}
                    />
                    {errors.chiefComplaint && <span className="absolute -bottom-5 left-2 text-destructive text-[10px] font-bold uppercase tracking-widest">{errors.chiefComplaint.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            <Info size={14} weight="bold" className="text-muted-foreground/60" /> Medical History <span className="text-[9px] text-muted-foreground/40 font-medium normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium focus-visible:outline-hidden focus:ring-1 focus:ring-primary/20 focus:border-primary/50 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                            placeholder="Known allergies, previous illnesses..."
                            {...register("medicalHistory")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                            <Notepad size={14} weight="bold" className="text-muted-foreground/60" /> Triage Remarks <span className="text-[9px] text-muted-foreground/40 font-medium normal-case tracking-normal">(Optional)</span>
                        </Label>
                        <textarea
                            className="w-full flex min-h-[90px] rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium focus-visible:outline-hidden focus:ring-1 focus:ring-primary/20 focus:border-primary/50 shadow-sm custom-scrollbar transition-all placeholder:text-muted-foreground/40"
                            placeholder="Additional triage notes..."
                            {...register("triageRemarks")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
