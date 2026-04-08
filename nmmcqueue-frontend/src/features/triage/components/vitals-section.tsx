"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drop, Heartbeat, Thermometer, Waves, Wind } from "@phosphor-icons/react";
import { useFormContext } from "react-hook-form";
import { TriageFormInput } from "../schemas";

export function VitalsSection() {
    const { register } = useFormContext<TriageFormInput>();

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
                <Heartbeat size={18} className="text-primary" weight="bold" />
                Vital Signs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Drop size={14} weight="bold" className="text-muted-foreground/60" /> BP (mmHg)
                    </Label>
                    <Input
                        placeholder="120/80"
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        {...register("bloodPressure")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Waves size={14} weight="bold" className="text-muted-foreground/60" /> Heart Rate
                    </Label>
                    <Input
                        type="number"
                        placeholder="80"
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        {...register("heartRate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Wind size={14} weight="bold" className="text-muted-foreground/60" /> Resp Rate
                    </Label>
                    <Input
                        type="number"
                        placeholder="18"
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        {...register("respiratoryRate")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Thermometer size={14} weight="bold" className="text-muted-foreground/60" /> Temp (°C)
                    </Label>
                    <Input
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        {...register("temperature")}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        <Drop size={14} weight="bold" className="text-muted-foreground/60" /> O2 Sat (%)
                    </Label>
                    <Input
                        type="number"
                        max="100"
                        placeholder="98"
                        className="h-10 rounded-lg border-border bg-background px-4 text-xs font-bold transition-all focus:ring-primary/20 focus:border-primary/50"
                        {...register("oxygenSat")}
                    />
                </div>
            </div>
        </div>
    );
}
