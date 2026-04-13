"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PriorityCategory } from "@/shared/types/models";
import type { ChangeEvent } from "react";
import type { KioskFormValues } from "../schemas";

interface PriorityStepProps {
    formData: KioskFormValues;
    availableCategories: PriorityCategory[];
    onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: unknown }
    ) => void;
    onCategoryToggle: (categoryId: string) => void;
}

export function PriorityStep({ formData, availableCategories, onChange, onCategoryToggle }: PriorityStepProps) {
    return (
        <div className="p-4 bg-slate-50 border rounded-md space-y-4">
            <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700 block">1. Visit Status</Label>
                <RadioGroup
                    onValueChange={(val) => onChange({ name: "hasAppointment", value: val === "true" })}
                    value={formData.hasAppointment ? "true" : "false"}
                    className="flex gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="appt-yes" />
                        <Label htmlFor="appt-yes" className="font-normal cursor-pointer">With Appointment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="appt-no" />
                        <Label htmlFor="appt-no" className="font-normal cursor-pointer">Without Appointment (Walk-in)</Label>
                    </div>
                </RadioGroup>
            </div>

            {availableCategories.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                    <Label className="text-sm font-semibold text-emerald-800 block">Special Classification / Priority</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {availableCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center space-x-2 bg-white p-2 rounded border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors"
                            >
                                <Checkbox
                                    id={`cat-${cat.id}`}
                                    checked={(formData.categoryIds || []).includes(cat.id)}
                                    onCheckedChange={() => onCategoryToggle(cat.id)}
                                />
                                <label
                                    htmlFor={`cat-${cat.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {cat.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
