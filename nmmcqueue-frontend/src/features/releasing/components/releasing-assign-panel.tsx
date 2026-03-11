"use client";

import { VisitWithPatient } from "@/features/triage/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Department } from "@/types/models";
import { X, CaretRight, WarningCircle, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { assignTicket } from "../actions";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedQueueOption, setSelectedQueueOption] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredDepartments = departments.filter((dept: Department) =>
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeDepartment = departments.find(d => d.id === selectedDepartmentId);
    const queueOptions = activeDepartment
        ? (queueOptionsByDepartment[activeDepartment.name.toUpperCase()] ?? DEFAULT_QUEUE_OPTIONS)
        : [];

    const handleAssign = () => {
        if (!selectedDepartmentId || !selectedQueueOption) return;

        startTransition(async () => {
            await assignTicket(selectedPatient.id, selectedDepartmentId, selectedQueueOption);
            onAssignComplete();
        });
    };

    return (
        <div className="bg-white rounded-t-3xl shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.15)] h-96 flex relative mx-4 -mt-6 border border-slate-200/50">
            {/* Minimalist Close Button overlaying the seam */}
            <button 
                onClick={onClose} 
                className="absolute -top-4 -right-2 p-2.5 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-105 z-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                aria-label="Close panel"
            >
                <X size={20} weight="bold" />
            </button>
            
            {/* Left 35%: Patient Summary (Soft Slate Background) */}
            <div className="w-[35%] bg-slate-50/80 p-8 flex flex-col rounded-tl-3xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="text-3xl font-black text-slate-800 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
                        #{selectedPatient.ticketNumber}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                            {selectedPatient.patient.lastName},<br/>{selectedPatient.patient.firstName}
                        </h3>
                        <div className="text-sm font-medium text-slate-500 flex gap-2 items-center mt-1">
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">{selectedPatient.patient.gender}</span>
                            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200">{selectedPatient.patient.age} yrs</span>
                        </div>
                    </div>
                </div>

                {/* Refined Vitals Grid */}
                <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex gap-4">
                        <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vitals</p>
                            <p className="font-mono font-bold text-slate-700 text-sm">
                                {selectedPatient.bloodPressure || '-'} <span className="text-slate-300">/</span> {selectedPatient.heartRate || '-'} <span className="text-slate-300">/</span> {selectedPatient.temperature || '-'}°
                            </p>
                        </div>
                        <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Disposition</p>
                            <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${selectedPatient.disposition?.includes('ER') ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                {selectedPatient.disposition || 'OPD'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Chief Complaint</p>
                        <p className="font-medium text-slate-800 text-sm leading-snug line-clamp-2">
                            {selectedPatient.chiefComplaint || 'None recorded.'}
                        </p>
                    </div>

                    {selectedPatient.triageRemarks && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Triage Note</p>
                            <p className="font-medium text-blue-900 text-sm leading-snug line-clamp-2 italic">
                                "{selectedPatient.triageRemarks}"
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle 35%: Department Selection */}
            <div className="w-[35%] p-8 flex flex-col bg-white border-x border-slate-100 relative">
                <div className="absolute right-0 top-1/2 -transparent-y-1/2 -mr-3 z-10 hidden lg:flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm text-slate-300">
                    <ArrowRight size={12} weight="bold" />
                </div>

                <div className="flex items-center justify-between mb-5">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select Dept</h4>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">{filteredDepartments.length}</span>
                </div>
                
                <Input
                    placeholder="Search departments..."
                    className="mb-4 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-xl px-4 h-11 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
                    {filteredDepartments.map((dept) => {
                        const isSelected = selectedDepartmentId === dept.id;
                        return (
                            <button
                                key={dept.id}
                                onClick={() => {
                                    setSelectedDepartmentId(dept.id);
                                    setSelectedQueueOption(""); // reset option when dept changes
                                }}
                                className={`w-full text-left px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-between group ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-2'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                                }`}
                            >
                                <span className="truncate pr-4">{dept.name}</span>
                                {isSelected ? (
                                    <CheckCircle weight="fill" className="text-white shrink-0" size={20} />
                                ) : (
                                    <CaretRight weight="bold" className="text-slate-300 group-hover:text-emerald-400 shrink-0 transition-colors" size={16} />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right 30%: Priority & Release Action (Soft Emerald Background) */}
            <div className={`w-[30%] p-8 flex flex-col transition-all duration-300 rounded-tr-3xl ${activeDepartment ? 'bg-emerald-50/60' : 'bg-slate-50/50'}`}>
                <div className="flex items-center justify-between mb-6 opacity-80" style={{ opacity: activeDepartment ? 1 : 0.4 }}>
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assign Priority</h4>
                </div>

                {!activeDepartment ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-6">
                        <ArrowRight size={32} className="mb-3 text-slate-300" weight="duotone" />
                        <p className="text-sm font-medium leading-relaxed">Select a department first to load its specific queue options.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Intelligent Recommendation */}
                        {badges.length > 0 && (
                            <div className="mb-5 bg-amber-50 rounded-xl p-3.5 flex items-start gap-3 border border-amber-200/60 shadow-sm">
                                <WarningCircle className="text-amber-500 shrink-0 mt-0.5" size={18} weight="fill" />
                                <div className="text-xs leading-relaxed text-amber-900/80">
                                    <span className="font-bold text-amber-900 block mb-0.5">Recommended</span>
                                    Patient has <strong className="font-black text-amber-700">[{badges.join(", ")}]</strong> flags. Ensure correct priority selection.
                                </div>
                            </div>
                        )}

                        {/* Priority Grid */}
                        <div className="grid grid-cols-2 gap-2.5 mb-auto">
                            {queueOptions.map(option => {
                                const isSelected = selectedQueueOption === option;
                                const isRecommended = badges.length > 0 && ["ER-REF", "PRIORITY", "SENIOR", "CHILD", "URGENT"].includes(option.toUpperCase());
                                
                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setSelectedQueueOption(option)}
                                        className={`px-3 py-3 text-xs font-black rounded-xl transition-all border text-center uppercase tracking-widest min-h-[52px] ${
                                            isSelected
                                                ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-[1.02]'
                                                : isRecommended 
                                                    ? 'bg-amber-100/50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400 shadow-sm ring-1 ring-amber-500/20'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Premium Primary Action */}
                        <Button
                            disabled={!selectedDepartmentId || !selectedQueueOption || isPending}
                            onClick={handleAssign}
                            className={`w-full h-14 mt-6 text-[15px] tracking-[0.15em] uppercase font-black transition-all duration-300 rounded-xl ${
                                !selectedDepartmentId || !selectedQueueOption || isPending 
                                    ? "bg-slate-200 text-slate-400 shadow-none" 
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/25 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/30"
                            }`}
                        >
                            {isPending ? "Assigning..." : "Release Ticket"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
