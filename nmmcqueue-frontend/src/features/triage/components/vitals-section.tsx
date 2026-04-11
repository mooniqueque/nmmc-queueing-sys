import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { Drop, Heartbeat, Icon, Thermometer, Waves, Wind } from "@phosphor-icons/react";
import { Controller, FieldPath, useFormContext } from "react-hook-form";
import { TriageFormInput } from "../schemas";

interface VitalConfig {
    id: keyof TriageFormInput;
    label: string;
    placeholder: string;
    icon: Icon;
    naKey: keyof TriageFormInput;
    type: "text" | "number";
    step?: string;
    max?: string;
}

export function VitalsSection() {
    const { register, watch, control, formState: { errors } } = useFormContext<TriageFormInput>();

    const vitals: VitalConfig[] = [
        { id: "bloodPressure", label: "BP (mmHg)", placeholder: "120/80", icon: Drop, naKey: "bloodPressureNA", type: "text" },
        { id: "heartRate", label: "Heart Rate", placeholder: "80", icon: Waves, naKey: "heartRateNA", type: "number" },
        { id: "respiratoryRate", label: "Resp Rate", placeholder: "18", icon: Wind, naKey: "respiratoryRateNA", type: "number" },
        { id: "temperature", label: "Temp (°C)", placeholder: "37.0", icon: Thermometer, naKey: "temperatureNA", type: "number", step: "0.1" },
        { id: "oxygenSat", label: "O2 Sat (%)", placeholder: "98", icon: Drop, naKey: "oxygenSatNA", type: "number", max: "100" },
    ];

    return (
        <div className="bg-muted/10 p-6 rounded-xl border border-border shadow-sm mt-8">
            <h3 className="flex items-center gap-2 text-sm font-extrabold tracking-widest uppercase text-muted-foreground mb-6 pb-4 border-b border-border">
                <Heartbeat size={20} className="text-primary" weight="bold" />
                Vital Signs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                {vitals.map((vital) => {
                    const isNA = watch(vital.naKey) as boolean;
                    const error = errors[vital.id];

                    return (
                        <div key={vital.id} className="space-y-2 group">
                            <div className="flex items-center justify-between px-1">
                                <Label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wide">
                                    <vital.icon size={14} weight="bold" className="text-muted-foreground/60" /> {vital.label}
                                </Label>
                                <Controller
                                    control={control}
                                    name={vital.naKey}
                                    render={({ field }) => (
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox
                                                id={`${vital.id}-na`}
                                                checked={!!field.value}
                                                onCheckedChange={field.onChange}
                                                className="size-3.5 border-slate-300"
                                            />
                                            <Label htmlFor={`${vital.id}-na`} className="text-[10px] font-bold text-slate-400 cursor-pointer uppercase select-none">N/A</Label>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="relative">
                                <Input
                                    type={vital.type}
                                    step={vital.step}
                                    max={vital.max}
                                    placeholder={isNA ? "N/A" : vital.placeholder}
                                    disabled={isNA}
                                    className={cn(
                                        "h-10 rounded-lg border-border bg-background px-4 text-lg font-semibold text-gray-900 transition-all focus:ring-primary/20 focus:border-primary/50",
                                        isNA && "opacity-40 bg-slate-100 placeholder:text-slate-400 cursor-not-allowed",
                                        error && "border-destructive ring-1 ring-destructive/20"
                                    )}
                                    {...register(vital.id)}
                                />
                                {error?.message && (
                                    <p className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                        {error.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
