'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Helper components for missing UI elements (Checkbox, Textarea)
// You might want to install these from shadcn/ui later: npx shadcn@latest add checkbox textarea
const Checkbox = ({ id, label }: { id: string, label: string }) => (
    <div className="flex items-center space-x-2">
        <input
            type="checkbox"
            id={id}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
            {label}
        </label>
    </div>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    />
);

export default function TriageNurseForm() {
    return (
        <div className="p-6 bg-slate-50 min-h-screen flex justify-center">
            <Card className="w-full max-w-5xl shadow-lg border-t-4 border-t-emerald-600">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl font-bold text-emerald-900">TRIAGE ASSESSMENT FORM</CardTitle>
                            <CardDescription className="text-emerald-700 font-medium mt-1">
                                TO BE FILLED OUT BY TRIAGE OFFICER
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-semibold text-slate-500">Date: {new Date().toLocaleDateString()}</div>
                            <div className="text-sm font-semibold text-slate-500">Time: {new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                    {/* SECTION 1: SYMPTOMS & INFECTIOUS STATUS */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        {/* Symptoms */}
                        <div className="md:col-span-8">
                            <Label className="text-base font-bold text-slate-700 mb-3 block">Symptoms Present</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Checkbox id="sym-fever" label="Fever" />
                                <Checkbox id="sym-cough" label="Cough" />
                                <Checkbox id="sym-colds" label="Colds" />
                                <Checkbox id="sym-rashes" label="Rashes" />
                            </div>
                        </div>

                        {/* Infectious Check */}
                        <div className="md:col-span-4 border-l pl-6 border-slate-200">
                            <Label className="text-base font-bold text-slate-700 mb-3 block">Infectious?</Label>
                            <div className="flex gap-6 mt-2">
                                <div className="flex items-center space-x-2">
                                    <input type="radio" name="infectious" id="inf-yes" className="text-emerald-600 focus:ring-emerald-500" />
                                    <label htmlFor="inf-yes" className="font-medium text-red-600">YES</label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="radio" name="infectious" id="inf-no" className="text-emerald-600 focus:ring-emerald-500" />
                                    <label htmlFor="inf-no" className="font-medium text-emerald-700">NO</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-200" />

                    {/* SECTION 2: VITAL SIGNS */}
                    <div>
                        <Label className="text-base font-bold text-slate-800 mb-4 block uppercase tracking-wide">Vital Signs</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vs-bp" className="text-xs font-semibold text-slate-500 uppercase">BP (mmHg)</Label>
                                <Input id="vs-bp" placeholder="120/80" className="font-mono text-center border-slate-300 focus:border-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vs-hr" className="text-xs font-semibold text-slate-500 uppercase">HR (bpm)</Label>
                                <Input id="vs-hr" placeholder="72" className="font-mono text-center border-slate-300 focus:border-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vs-rr" className="text-xs font-semibold text-slate-500 uppercase">RR (cpm)</Label>
                                <Input id="vs-rr" placeholder="16" className="font-mono text-center border-slate-300 focus:border-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vs-temp" className="text-xs font-semibold text-slate-500 uppercase">Temp (°C)</Label>
                                <Input id="vs-temp" placeholder="36.5" className="font-mono text-center border-slate-300 focus:border-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vs-o2" className="text-xs font-semibold text-slate-500 uppercase">O2 Sat (%)</Label>
                                <Input id="vs-o2" placeholder="98" className="font-mono text-center border-slate-300 focus:border-emerald-500" />
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-200" />

                    {/* SECTION 3: CLINICAL NOTES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="font-bold text-slate-700">Reason for Consultation</Label>
                            <Textarea id="reason" placeholder="Enter chief complaint..." className="h-32 resize-none" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="history" className="font-bold text-slate-700">Pertinent History</Label>
                            <Textarea id="history" placeholder="Enter medical history..." className="h-32 resize-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks" className="font-bold text-slate-700">Remarks / Initial Assessment</Label>
                        <Textarea id="remarks" placeholder="Enter additional notes..." className="h-20 resize-y" />
                    </div>

                    <Separator className="bg-slate-200 my-4" />

                    {/* SECTION 4: DISPOSITION & DESTINATION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-6 rounded-lg border border-slate-200">
                        {/* Disposition */}
                        <div>
                            <Label className="text-sm font-bold text-slate-500 uppercase mb-3 block">Triage Officer's Disposition</Label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-red-50 cursor-pointer">
                                    <input type="radio" name="disposition" id="disp-emergent" className="h-4 w-4 text-red-600 focus:ring-red-500" />
                                    <label htmlFor="disp-emergent" className="font-bold text-red-700 cursor-pointer">EMERGENT (Immediate Attention)</label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-yellow-50 cursor-pointer">
                                    <input type="radio" name="disposition" id="disp-urgent" className="h-4 w-4 text-yellow-600 focus:ring-yellow-500" />
                                    <label htmlFor="disp-urgent" className="font-bold text-yellow-700 cursor-pointer">URGENT (Within 30 mins)</label>
                                </div>
                                <div className="flex items-center space-x-2 p-2 rounded hover:bg-emerald-50 cursor-pointer">
                                    <input type="radio" name="disposition" id="disp-non-urgent" className="h-4 w-4 text-emerald-600 focus:ring-emerald-500" />
                                    <label htmlFor="disp-non-urgent" className="font-bold text-emerald-700 cursor-pointer">NON-URGENT (Queue)</label>
                                </div>
                            </div>
                        </div>

                        {/* Destination */}
                        <div>
                            <Label className="text-sm font-bold text-slate-500 uppercase mb-3 block">Patient Destination</Label>
                            <div className="space-y-4">
                                <div className="bg-white p-3 border rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <input type="radio" name="destination" id="dest-opd" className="h-4 w-4 text-emerald-600" defaultChecked />
                                        <label htmlFor="dest-opd" className="font-bold text-emerald-900">To OPD Clinic</label>
                                    </div>
                                    <Input placeholder="Specify Clinic (e.g. IM, Pediatrics, Surgery)" className="mt-1" />
                                </div>

                                <div className="bg-red-50 p-3 border border-red-100 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="destination" id="dest-er" className="h-4 w-4 text-red-600" />
                                        <label htmlFor="dest-er" className="font-bold text-red-700">To Emergency Room (ER)</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: SIGNATURE */}
                    <div className="pt-6 flex justify-end">
                        <div className="w-full max-w-sm">
                            <Label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Triage Officer's Name / Signature</Label>
                            <Input placeholder="Enter Verify Name" className="font-medium text-lg border-b-2 border-t-0 border-x-0 rounded-none px-0 shadow-none border-slate-400 focus:border-emerald-600 focus:ring-0" />
                            <div className="text-right text-xs text-slate-400 mt-1">Authorized Signature</div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" className="border-slate-300 text-slate-600 w-32">Clear Form</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 w-40">Submit Triage</Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
