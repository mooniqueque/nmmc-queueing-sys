"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { TriageFormValues } from "../schemas";
import { Heartbeat, Thermometer, Drop, Waves, Wind } from "@phosphor-icons/react";

export function VitalsSection() {
    const { register } = useFormContext<TriageFormValues>();

    return (
        <div className="bg-sky-50/50 p-6 rounded-[20px] border border-sky-100 shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-sky-800 mb-6 pb-4 border-b border-sky-200/50">
                <Heartbeat size={22} className="text-sky-600" weight="duotone" />
                Vital Signs
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        <Drop size={14} weight="fill" className="text-rose-500"/> BP (mmHg)
                    </Label>
                    <Input 
                        placeholder="120/80" 
                        className="bg-white pl-4 h-12 rounded-xl border-sky-200 focus:border-sky-500 focus:ring-sky-500/20 shadow-sm text-base font-bold text-slate-800"
                        {...register("bloodPressure")} 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        <Waves size={14} weight="bold" /> Heart Rate
                    </Label>
                    <Input 
                        type="number" 
                        placeholder="80" 
                        className="bg-white pl-4 h-12 rounded-xl border-sky-200 focus:border-sky-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("heartRate")} 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        <Wind size={14} weight="fill" className="text-slate-400" /> Resp Rate
                    </Label>
                    <Input 
                        type="number" 
                        placeholder="18" 
                        className="bg-white pl-4 h-12 rounded-xl border-sky-200 focus:border-sky-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("respiratoryRate")} 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        <Thermometer size={14} weight="fill" className="text-amber-500" /> Temp (°C)
                    </Label>
                    <Input 
                        type="number" 
                        step="0.1" 
                        placeholder="37.0" 
                        className="bg-white pl-4 h-12 rounded-xl border-sky-200 focus:border-sky-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("temperature")} 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                        <Drop size={14} weight="fill" className="text-cyan-500"/> O2 Sat (%)
                    </Label>
                    <Input 
                        type="number" 
                        max="100" 
                        placeholder="98" 
                        className="bg-white pl-4 h-12 rounded-xl border-sky-200 focus:border-sky-500 shadow-sm text-base font-bold text-slate-800"
                        {...register("oxygenSat")} 
                    />
                </div>
            </div>
        </div>
    );
}
