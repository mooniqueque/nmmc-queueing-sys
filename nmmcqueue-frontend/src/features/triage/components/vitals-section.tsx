"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { Heartbeat, Thermometer, Drop, Waves, Wind } from "@phosphor-icons/react";

export function VitalsSection() {
    const { register } = useFormContext<TriageFormValues>();

    return (
        <div className="bg-slate-50/70 p-6 rounded-lg border border-slate-200/60 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-tight uppercase text-slate-800 mb-6 pb-4 border-b border-slate-200/50">
                <Heartbeat size={22} className="text-sky-600" weight="duotone" />
                Vital Signs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Drop size={14} weight="fill" className="text-slate-500" /> BP (mmHg)
                    </Label>
                    <Input
                        placeholder="120/80"
                        className="bg-white pl-4 h-12 rounded-lg border-slate-200 focus:border-slate-500 focus:ring-slate-500/20 shadow-sm text-base font-bold text-slate-800"
                        {...register("bloodPressure")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Waves size={14} weight="bold" /> Heart Rate
                    </Label>
                    <Input
                        type="number"
                        placeholder="80"
                        className="bg-white pl-4 h-12 rounded-lg border-slate-200 focus:border-slate-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("heartRate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Wind size={14} weight="fill" className="text-slate-500" /> Resp Rate
                    </Label>
                    <Input
                        type="number"
                        placeholder="18"
                        className="bg-white pl-4 h-12 rounded-lg border-slate-200 focus:border-slate-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("respiratoryRate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Thermometer size={14} weight="fill" className="text-slate-500" /> Temp (°C)
                    </Label>
                    <Input
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        className="bg-white pl-4 h-12 rounded-lg border-slate-200 focus:border-slate-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("temperature")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Drop size={14} weight="fill" className="text-slate-500" /> O2 Sat (%)
                    </Label>
                    <Input
                        type="number"
                        max="100"
                        placeholder="98"
                        className="bg-white pl-4 h-12 rounded-lg border-slate-200 focus:border-slate-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("oxygenSat")}
                    />
                </div>
            </div>
        </div>
    );
}
