"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VisitWithPatient } from "@/features/triage/types";
import { Department } from "@/types/models";
import { useState, useTransition, useMemo } from "react";
import { callTicket, noShowTicket, assignTicket } from "../actions";
import { X, User, Printer, Phone, WarningCircle, BellRinging } from "@phosphor-icons/react";
import { calculateAge } from "@/lib/utils";
import { toast } from "sonner";

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

    const handleCall = () => {
        startTransition(async () => {
            const res = await callTicket(selectedPatient.id);
            if (res.success) toast.success("Patient called to window");
            else toast.error(res.error || "Failed to call patient");
        });
    };

    const handleNoShow = () => {
        startTransition(async () => {
            const res = await noShowTicket(selectedPatient.id);
            if (res.success) toast.success("Patient marked as no-show");
            else toast.error(res.error || "Failed to update status");
        });
    };

    const handleAssign = () => {
        if (!selectedDepartmentId || !selectedQueueOption) return;

        startTransition(async () => {
            await assignTicket(selectedPatient.id, selectedDepartmentId, selectedQueueOption);
            toast.success("Ticket printed and assigned successfully");
            onAssignComplete();
        });
    };

    const isCalled = selectedPatient.status === 'IN_PROGRESS';
    const isNoShow = selectedPatient.status === 'NO_SHOW';

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-full flex flex-col pt-6 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 lg:px-8 pb-5 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-[19px] font-black text-slate-800 tracking-tight">Patient Verification & Routing</h3>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <X size={20} weight="bold" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 custom-scrollbar shrink-0">
                
                {/* Status Alert */}
                {isNoShow && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700 font-bold text-sm">
                        <WarningCircle size={20} weight="fill" />
                        Patient was previously marked as NO-SHOW.
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative mb-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                            <User size={32} weight="fill" className="text-slate-300" />
                        </div>
                        <div className="pr-8">
                            <h2 className="text-[22px] leading-tight font-black text-slate-900 mb-1 tracking-tight">
                                {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-bold text-slate-500">
                                <span>ID: <strong className="text-slate-700 tracking-wide">#{selectedPatient.ticketNumber.toString().padStart(4, '0')}</strong></span>
                                <span className="opacity-40">•</span>
                                <span>Gender: <strong className="text-slate-700">{selectedPatient.patient.gender}</strong></span>
                                <span className="opacity-40">•</span>
                                <span>Age: <strong className="text-slate-700">{calculateAge(selectedPatient.patient.dateOfBirth)}y</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Chief Complaint</span>
                        <p className="text-[14px] font-medium text-slate-700 italic">
                            &ldquo;{selectedPatient.chiefComplaint || 'No complaint specified'}&rdquo;
                        </p>
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

                {/* Quick Actions (Call / No-Show) */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {!isCalled ? (
                        <Button 
                            onClick={handleCall}
                            disabled={isPending}
                            className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest gap-2 rounded-2xl shadow-lg shadow-emerald-600/20"
                        >
                            <BellRinging size={24} weight="fill" />
                            Call Patient
                        </Button>
                    ) : (
                        <div className="h-14 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 font-black uppercase tracking-widest text-xs animate-pulse">
                            <Phone size={24} weight="fill" />
                            Currently Serving
                        </div>
                    )}

                    <Button 
                        variant="outline"
                        onClick={handleNoShow}
                        disabled={isPending || isNoShow}
                        className="h-14 border-slate-200 text-slate-600 font-bold uppercase tracking-widest gap-2 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                    >
                        <X size={20} weight="bold" />
                        No Show
                    </Button>
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
                        disabled={!selectedDepartmentId || !selectedQueueOption || isPending || !isCalled}
                        onClick={handleAssign}
                        className="h-12 bg-emerald-500 hover:bg-emerald-400 border-none shadow-lg shadow-emerald-500/20 text-white text-[14px] px-8 font-black uppercase tracking-widest transition-transform active:scale-95 flex-1 max-w-[280px] gap-2"
                    >
                        {isPending ? "Routing..." : (
                            <>
                                <Printer size={20} weight="fill" /> Print & Assign
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
    );
}
