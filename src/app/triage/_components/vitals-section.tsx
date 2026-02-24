"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { TriageFormValues } from "../_schemas/triage-schema";

export function VitalsSection() {
    const { register } = useFormContext<TriageFormValues>();

    return (
        <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-4">
            <h3 className="font-bold text-slate-700 uppercase border-b border-blue-200 pb-2">Vital Signs</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                    <Label>Blood Pressure</Label>
                    <Input placeholder="120/80" {...register("bloodPressure")} />
                </div>
                <div className="space-y-2">
                    <Label>Heart Rate (bpm)</Label>
                    <Input type="number" placeholder="80" {...register("heartRate")} />
                </div>
                <div className="space-y-2">
                    <Label>Resp. Rate (cpm)</Label>
                    <Input type="number" placeholder="18" {...register("respiratoryRate")} />
                </div>
                <div className="space-y-2">
                    <Label>Temp (°C)</Label>
                    <Input type="number" step="0.1" placeholder="37.0" {...register("temperature")} />
                </div>
                <div className="space-y-2">
                    <Label>O2 Saturation (%)</Label>
                    <Input type="number" max="100" placeholder="98" {...register("oxygenSat")} />
                </div>
            </div>
        </div>
    );
}
