"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { ChangeEvent } from "react";
import type { KioskFormValues } from "../schemas";

interface VitalsStepProps {
    formData: KioskFormValues;
    errors: Partial<Record<keyof KioskFormValues, string>>;
    religionOptions: string[];
    calculateAge: () => string;
    onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement> | { name: string; value: unknown }
    ) => void;
}

export function VitalsStep({ formData, errors, religionOptions, calculateAge, onChange }: VitalsStepProps) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                    <Label>Date of Birth *</Label>
                    <div className="flex gap-2 relative">
                        <Input
                            placeholder="Month"
                            list="months-list"
                            name="dobMonth"
                            className={`bg-white w-full ${calculateAge() === "Invalid" ? "border-red-500" : ""}`}
                            value={formData.dobMonth || ""}
                            onChange={onChange}
                        />
                        <datalist id="months-list">
                            <option value="January" />
                            <option value="February" />
                            <option value="March" />
                            <option value="April" />
                            <option value="May" />
                            <option value="June" />
                            <option value="July" />
                            <option value="August" />
                            <option value="September" />
                            <option value="October" />
                            <option value="November" />
                            <option value="December" />
                        </datalist>
                        <Input
                            placeholder="Day"
                            maxLength={2}
                            name="dobDay"
                            className={`bg-white w-20 ${calculateAge() === "Invalid" ? "border-red-500" : ""}`}
                            value={formData.dobDay || ""}
                            onChange={onChange}
                        />
                        <Input
                            placeholder="Year"
                            maxLength={4}
                            name="dobYear"
                            className={`bg-white w-24 ${calculateAge() === "Invalid" ? "border-red-500" : ""}`}
                            value={formData.dobYear || ""}
                            onChange={onChange}
                        />

                        {calculateAge() === "Invalid" && !errors.dobMonth && !errors.dobDay && !errors.dobYear && (
                            <span className="absolute -bottom-5 left-1 text-red-500 text-[10px] font-semibold">
                                Please provide a valid birth date
                            </span>
                        )}
                    </div>
                    {errors.dobMonth && <p className="text-xs text-red-500">{errors.dobMonth}</p>}
                    {errors.dobDay && <p className="text-xs text-red-500">{errors.dobDay}</p>}
                    {errors.dobYear && <p className="text-xs text-red-500">{errors.dobYear}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                        value={calculateAge()}
                        disabled
                        className={`font-medium ${calculateAge() === "Invalid" ? "bg-red-50 text-red-500 border-red-200" : "bg-slate-100"}`}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="birthPlace">Birthplace *</Label>
                    <Input id="birthPlace" name="birthPlace" className="bg-white" value={formData.birthPlace} onChange={onChange} />
                    {errors.birthPlace && <p className="text-xs text-red-500">{errors.birthPlace}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Sex *</Label>
                    <select
                        id="gender"
                        name="gender"
                        value={formData.gender || ""}
                        onChange={onChange}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                        <option value="">Select Gender</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                    </select>
                    {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="civilStatus">Civil Status *</Label>
                    <select
                        id="civilStatus"
                        name="civilStatus"
                        value={formData.civilStatus || ""}
                        onChange={onChange}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Separated">Separated</option>
                    </select>
                    {errors.civilStatus && <p className="text-xs text-red-500">{errors.civilStatus}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="religion">Religion *</Label>
                    <SearchableSelect
                        options={religionOptions.map((rel) => ({ label: rel, value: rel }))}
                        value={formData.religion}
                        onSelect={(val: string) => onChange({ name: "religion", value: val })}
                        placeholder="Select Religion"
                        searchPlaceholder="Search religion..."
                        emptyMessage="No religion found."
                        className={errors.religion ? "border-red-500 ring-1 ring-red-500/20 text-red-500" : "text-slate-800"}
                    />
                    {errors.religion && <p className="text-xs text-red-500">{errors.religion}</p>}
                </div>
            </div>
        </div>
    );
}
