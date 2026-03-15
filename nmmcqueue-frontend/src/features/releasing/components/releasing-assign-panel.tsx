"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VisitWithPatient } from "@/features/triage/types";
import { Department } from "@/types/models";
import { useState, useTransition, useMemo } from "react";
import { assignTicket } from "../actions";
import { X, User, PencilSimple, BookmarkSimple, Printer, WarningCircle } from "@phosphor-icons/react";

interface ReleasingAssignPanelProps {
    selectedPatient: VisitWithPatient;
    departments: Department[];
    queueOptionsByDepartment: Record<string, string[]>;
    badges: string[];
    onClose: () => void;
    onAssignComplete: () => void;
}

const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];

export function ReleasingAssignPanel({
    selectedPatient,
    departments,
    queueOptionsByDepartment,
    badges,
    onClose,
    onAssignComplete
}: ReleasingAssignPanelProps) {
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedQueueOption, setSelectedQueueOption] = useState("");
    const [notes, setNotes] = useState("");
    const [isPending, startTransition] = useTransition();

    const activeDepartment = departments.find(d => d.id === selectedDepartmentId);
    const queueOptions = activeDepartment
        ? (queueOptionsByDepartment[activeDepartment.name.toUpperCase()] ?? DEFAULT_QUEUE_OPTIONS)
        : DEFAULT_QUEUE_OPTIONS;

    // Intelligent Recommendation
    const recommendedOption = useMemo(() => {
        if (badges.includes("ER-REF") || selectedPatient.disposition?.toUpperCase().includes("ER")) return "ER-REF";
        if (badges.includes("SENIOR") || badges.includes("CHILD")) return "PRIORITY";
        return "";
    }, [badges, selectedPatient.disposition]);

    const handleAssign = () => {
        if (!selectedDepartmentId || !selectedQueueOption) return;

        startTransition(async () => {
            await assignTicket(selectedPatient.id, selectedDepartmentId, selectedQueueOption);
            // We would also save 'notes' via a different backend call here if your API supports it.
            onAssignComplete();
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-full flex flex-col pt-6 overflow-hidden">

            {/* Header */}
            <div className="px-6 lg:px-8 pb-5 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-[19px] font-bold text-slate-800 tracking-tight">Patient Verification & Routing</h3>
                <span className="bg-emerald-500 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm shadow-emerald-500/20">
                    Active Processing
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 custom-scrollbar shrink-0">

                {/* Profile Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative mb-6 hover:shadow-md transition-shadow">
                    <button className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors group">
                        <PencilSimple size={20} weight="duotone" className="group-hover:text-emerald-500" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                            <User size={32} weight="fill" className="text-slate-300" />
                        </div>
                        <div className="pr-8">
                            <h2 className="text-[22px] leading-tight font-bold text-slate-900 mb-1 tracking-tight">
                                {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center py-1 gap-x-4 gap-y-1 text-[13px] font-bold text-slate-500">
                                <span>ID: <strong className="text-slate-700 tracking-wide">#{selectedPatient.ticketNumber.toString().padStart(4, '0')}</strong></span>
                                <span className="opacity-40">•</span>
                                <span>Gender: <strong className="text-slate-700">{selectedPatient.patient.gender}</strong></span>
                                <span className="opacity-40">•</span>
                                <span>Age: <strong className="text-slate-700">{selectedPatient.patient.age}y</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {selectedPatient.disposition?.toUpperCase().includes("ER") && (
                            <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm shadow-rose-500/20">
                                Priority: Red (Urgent)
                            </span>
                        )}
                        {badges.includes("SENIOR") && (
                            <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm shadow-rose-500/20">
                                Priority: Senior
                            </span>
                        )}
                        {badges.map(b => (
                            <span key={b} className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-blue-200">
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Vitals Ribbon */}
                <div className="grid grid-cols-4 gap-3 mb-8">
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Pressure</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-[20px] font-black tracking-tighter ${selectedPatient.bloodPressure ? 'text-rose-600' : 'text-slate-300'}`}>
                                {selectedPatient.bloodPressure || "--/--"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">mmHg</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Temperature</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-[20px] font-black tracking-tighter ${selectedPatient.temperature ? 'text-slate-800' : 'text-slate-300'}`}>
                                {selectedPatient.temperature || "--"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">°C</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Heart Rate</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-[20px] font-black tracking-tighter ${selectedPatient.heartRate ? 'text-slate-800' : 'text-slate-300'}`}>
                                {selectedPatient.heartRate || "--"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">bpm</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Weight</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[20px] font-black tracking-tighter text-slate-300">--</span>
                            <span className="text-[10px] font-bold text-slate-400">kg</span>
                        </div>
                    </div>
                </div>

                {/* Routing Selects */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <Label className="text-[13px] font-bold text-slate-700 tracking-tight mb-2 block">Assign Clinic / Department</Label>
                        <select
                            className="w-full bg-white border border-slate-300 text-slate-800 text-[14px] font-bold rounded-xl h-11 px-4 appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                            value={selectedDepartmentId}
                            onChange={(e) => {
                                setSelectedDepartmentId(e.target.value);
                                setSelectedQueueOption("");
                            }}
                        >
                            <option value="" disabled>Select Department...</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label className="text-[13px] font-bold text-slate-700 tracking-tight mb-2 flex items-center justify-between">
                            Priority Type
                            {recommendedOption && (
                                <span className="text-[9px] uppercase tracking-widest text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                    Suggested: {recommendedOption}
                                </span>
                            )}
                        </Label>
                        <select
                            className="w-full bg-white border border-slate-300 text-slate-800 text-[14px] font-bold rounded-xl h-11 px-4 appearance-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                            value={selectedQueueOption}
                            onChange={(e) => setSelectedQueueOption(e.target.value)}
                            disabled={!selectedDepartmentId}
                        >
                            <option value="" disabled>Select Priority...</option>
                            {queueOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Internal Notes */}
                <div className="mb-6">
                    <Label className="text-[13px] font-bold text-slate-700 tracking-tight mb-2 block">Internal Routing Notes</Label>
                    <textarea
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[14px] font-medium rounded-xl p-4 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner resize-none h-28 placeholder:text-slate-400 placeholder:italic"
                        placeholder="Add instructions for nursing staff or the receiving clinic..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Bottom Global Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 lg:p-6 flex items-center justify-between gap-4 mt-auto rounded-b-2xl">
                <button
                    onClick={onClose}
                    className="text-[14px] font-bold text-slate-500 hover:text-slate-800 transition-colors px-2"
                >
                    Clear <br /> Selection
                </button>

                <div className="flex gap-3 w-full justify-end">
                    <Button
                        variant="outline"
                        disabled={!selectedDepartmentId || !selectedQueueOption || isPending}
                        className="h-12 border-emerald-500text-[14px] px-6 text-emerald-600 font-bold uppercase tracking-widest border-2 hover:bg-emerald-50 hidden xl:flex gap-2"
                    >
                        <BookmarkSimple size={18} weight="bold" /> Save Record
                    </Button>

                    <Button
                        disabled={!selectedDepartmentId || !selectedQueueOption || isPending}
                        onClick={handleAssign}
                        className="h-12 bg-emerald-500 hover:bg-emerald-400 border-none shadow-lg shadow-emerald-500/20 text-white text-[14px] px-8 font-black uppercase tracking-widest transition-transform active:scale-95 flex-1 max-w-[280px] gap-2"
                    >
                        {isPending ? "Routing..." : (
                            <>
                                <Printer size={20} weight="fill" /> Print New Ticket
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
    );
}
