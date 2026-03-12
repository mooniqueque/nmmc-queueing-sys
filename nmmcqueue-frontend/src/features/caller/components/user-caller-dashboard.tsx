"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useClinicQueue } from "@/app/(admin)/_hooks/use-clinic-queue";
import { VisitWithPatient } from "@/features/triage/types";
import { toast } from "sonner";
import { callPatient, servePatient, noShowPatient, restorePatient } from "../api";
import { 
    Clock, Users, SpeakerHigh, UserMinus, CheckCircle, Hash, Phone, Heartbeat, Thermometer, Info, ArrowUpRight, ArrowSquareOut
} from "@phosphor-icons/react";
import { getDepartments } from "@/features/shared/api";
import { Department } from "@/types/models";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { transferPatient } from "../api";


export default function UserCallerDashboard({
    department,
    initialQueue = []
}: {
    department: string;
    initialQueue?: VisitWithPatient[];
}) {
    const isAvailable = true;
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<"pending" | "noshow" | "referrals">("pending");
    const [allDepartments, setAllDepartments] = useState<Department[]>([]);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [targetDeptId, setTargetDeptId] = useState<string>("");

    useEffect(() => {
        getDepartments().then(res => {
            if (res.success) setAllDepartments(res.data);
        });
    }, []);

    // Live Queue Hook locked directly to the user's role department
    const { activeQueue } = useClinicQueue(department, initialQueue);

    // Filter queue to make absolutely sure we only count tickets for THIS department
    const departmentQueue = activeQueue.filter((v: VisitWithPatient) => 
        v.department?.name?.toUpperCase() === department.toUpperCase()
    );

    // Simplistic handling of what is "Now Serving" vs "Waitlist"
    const inProgressVisit = departmentQueue.find(v => v.status === "IN_PROGRESS");
    const waitingList = departmentQueue.filter(v => v.status === "WAITING_CLINIC" && !v.isReferred);
    const referralList = departmentQueue.filter(v => v.status === "WAITING_CLINIC" && v.isReferred);
    const noShowList = departmentQueue.filter(v => v.status === "NO_SHOW");
    const nextVisit = waitingList.length > 0 ? waitingList[0] : (referralList.length > 0 ? referralList[0] : null);

    // Action Handlers
    const handleCallNext = async () => {
        if (!nextVisit) return toast.info("No more patients in the waiting list.");
        if (inProgressVisit) return toast.error("Please Mark Served or No Show the current patient first.");
        
        setIsProcessing(true);
        try {
            await callPatient(nextVisit.id);
            toast.success(`Calling patient P-${nextVisit.ticketNumber.toString().padStart(3, '0')}`);
        } catch {
            toast.error("Failed to call patient.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleServe = async () => {
        if (!inProgressVisit) return toast.error("No active patient to serve.");
        setIsProcessing(true);
        try {
            await servePatient(inProgressVisit.id);
            toast.success("Patient consultation completed.");
        } catch {
            toast.error("Failed to mark patient as served.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNoShow = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return toast.error("No patient selected to mark as No Show.");
        setIsProcessing(true);
        try {
            await noShowPatient(targetVisit.id);
            toast.error(`Patient P-${targetVisit.ticketNumber.toString().padStart(3, '0')} marked as NO SHOW`);
        } catch {
            toast.error("Failed to process No Show.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReferral = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return toast.error("No patient selected for referral.");
        if (!targetDeptId) return toast.error("Please select a target department.");

        setIsProcessing(true);
        try {
            const res = await transferPatient(targetVisit.id, targetDeptId);
            if (res.success) {
                toast.success(`Patient referred successfully.`);
                setIsReferralModalOpen(false);
                setTargetDeptId("");
            } else {
                toast.error(res.error || "Failed to refer patient.");
            }
        } catch {
            toast.error("An error occurred during referral.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRestore = async (visitId: string) => {
        setIsProcessing(true);
        try {
            await restorePatient(visitId);
            toast.success("Patient restored to active queue.");
        } catch {
            toast.error("Failed to restore patient.");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-50/50 p-6 lg:p-8 gap-6">
            
            {/* LEFT PANE: Waitlist (35%) */}
            <div className="flex flex-col w-full lg:w-[35%] xl:w-[30%] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-[18px] font-black tracking-tight">{department}</h2>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            <span className="text-emerald-400 font-black">{waitingList.length}</span> Active • <span className="text-rose-400 font-black">{noShowList.length}</span> No Shows
                        </p>
                    </div>
                    {/* Status Display */}
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_var(--color-emerald-500)]' : 'bg-rose-500 shadow-[0_0_8px_var(--color-rose-500)]'}`} />
                            <span className="text-[11px] font-extrabold tracking-widest uppercase text-slate-300">
                                {isAvailable ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 pt-4 border-b border-slate-100 bg-white gap-2">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                            activeTab === "pending" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Active ({waitingList.length})
                        {activeTab === "pending" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("referrals")}
                        className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                            activeTab === "referrals" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Referrals ({referralList.length})
                        {activeTab === "referrals" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("noshow")}
                        className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                            activeTab === "noshow" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        No Shows ({noShowList.length})
                        {activeTab === "noshow" && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    {activeTab === "pending" ? (
                        waitingList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <CheckCircle size={48} className="mb-4 text-emerald-500/20" weight="duotone" />
                                <p className="text-lg font-bold text-slate-600">Queue is Clear</p>
                                <p className="text-sm font-medium text-slate-400 mt-1">No patients waiting for this clinic.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {waitingList.map((visit, index) => {
                                    const isNext = index === 0 && !inProgressVisit;
                                    const waitMins = Math.floor((new Date().getTime() - new Date(visit.createdAt).getTime()) / 60000);
                                    const waitStr = waitMins > 60 ? `${Math.floor(waitMins / 60)}h ${waitMins % 60}m` : `${waitMins}m`;

                                    return (
                                        <div 
                                            key={visit.id} 
                                            className={`p-5 border-b border-slate-200/60 relative transition-all ${
                                                isNext ? "bg-white shadow-[inset_4px_0_0_#10b981]" : "bg-transparent opacity-80 hover:bg-white hover:opacity-100"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[17px] font-black ${isNext ? "text-emerald-600" : "text-slate-500"}`}>
                                                        #{visit.ticketNumber.toString().padStart(3, '0')}
                                                    </span>
                                                    {isNext && (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                            Next
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200 text-slate-500 text-[11px] font-bold">
                                                    <Clock size={12} weight="bold" /> {waitStr}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[14px] text-slate-800 leading-tight">
                                                        {visit.patient.lastName}, <span className="opacity-80">{visit.patient.firstName}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : activeTab === "referrals" ? (
                        referralList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <ArrowUpRight size={48} className="mb-4 text-emerald-500/20" weight="duotone" />
                                <p className="text-lg font-bold text-slate-600">No Referrals</p>
                                <p className="text-sm font-medium text-slate-400 mt-1">No incoming referrals right now.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {referralList.map((visit, index) => {
                                    const isNext = index === 0 && !inProgressVisit && waitingList.length === 0;
                                    return (
                                        <div 
                                            key={visit.id} 
                                            className={`p-5 border-b border-slate-200/60 relative transition-all ${
                                                isNext ? "bg-white shadow-[inset_4px_0_0_#10b981]" : "bg-transparent opacity-80 hover:bg-white"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[17px] font-black ${isNext ? "text-emerald-600" : "text-slate-500"}`}>
                                                    #{visit.ticketNumber.toString().padStart(3, '0')}
                                                </span>
                                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-100">
                                                    Referred from: {visit.referredFrom?.name || "N/A"}
                                                </span>
                                            </div>
                                            <span className="font-bold text-[14px] text-slate-800">
                                                {visit.patient.lastName}, {visit.patient.firstName}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        noShowList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <UserMinus size={48} className="mb-4 text-slate-200" weight="duotone" />
                                <p className="text-lg font-bold text-slate-400">No Show list empty</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {noShowList.map((visit) => (
                                    <div 
                                        key={visit.id} 
                                        className="p-5 border-b border-slate-200/60 bg-white/50 hover:bg-white transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[17px] font-black text-rose-400">
                                                #{visit.ticketNumber.toString().padStart(3, '0')}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore(visit.id)}
                                                disabled={isProcessing}
                                                className="h-8 px-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                                            >
                                                Restore
                                            </Button>
                                        </div>
                                        <span className="font-bold text-[14px] text-slate-600 group-hover:text-slate-900 transition-colors">
                                            {visit.patient.lastName}, {visit.patient.firstName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Active Consultation (65%) */}
            <div className="flex flex-col flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                
                {(!inProgressVisit && !nextVisit) ? (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-50/50">
                        <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                            <Users size={40} className="text-slate-300" weight="duotone" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">You are all caught up!</h2>
                        <p className="text-slate-500 font-medium">There are currently no patients assigned to {department}.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 xl:p-12 relative w-full">
                            <div className="max-w-4xl mx-auto">
                                
                                {/* Status Header */}
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                    <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400">
                                        {inProgressVisit ? "Active Consultation" : "Up Next"}
                                    </h3>
                                    {inProgressVisit ? (
                                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-200/50">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[11px] font-black uppercase tracking-widest">In Progress</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-200/50">
                                            <span className="text-[11px] font-black uppercase tracking-widest">Waiting to be called</span>
                                        </div>
                                    )}
                                </div>

                                {/* Main Active Patient Card */}
                                 {(() => {
                                    const activeTarget = inProgressVisit || nextVisit;
                                    if (!activeTarget) return null;

                                    return (
                                        <div className="flex flex-col">
                                            
                                            {/* Big Ticket & Name Segment */}
                                            <div className="flex flex-col md:flex-row md:items-center gap-8 mb-10 w-full">
                                                <div className="flex flex-col justify-center items-center w-40 h-40 shrink-0 bg-slate-900 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
                                                    <span className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket No.</span>
                                                    <span className="text-5xl font-black text-white tracking-tighter">
                                                        #{activeTarget.ticketNumber.toString().padStart(3, '0')}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3 truncate w-full">
                                                        {activeTarget.patient.firstName} <span className="opacity-90">{activeTarget.patient.lastName}</span>
                                                    </h1>
                                                    
                                                    <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold text-slate-500 mb-4">
                                                        <span className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                            <Hash size={16} /> ID: {activeTarget.patient.id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-slate-600">
                                                            {activeTarget.patient.gender} • {activeTarget.patient.age} years old
                                                        </span>
                                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded border border-emerald-200">
                                                            {activeTarget.priorityClass || "REGULAR"}
                                                        </span>
                                                    </div>

                                                    {activeTarget.patient.contactNo && (
                                                        <div className="flex items-center gap-2 text-[14px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                                                            <Phone size={16} weight="duotone" />
                                                            {activeTarget.patient.contactNo}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Advanced Triage Info (Passed from previous step) */}
                                            <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Info size={18} className="text-emerald-500" /> Intake Information
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Chief Complaint</span>
                                                    <p className="text-[15px] font-bold text-slate-800 leading-snug">
                                                        {activeTarget.chiefComplaint || "No complaint recorded."}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blood Pressure</span>
                                                        <span className="text-2xl font-black text-rose-600 tracking-tighter">
                                                            {activeTarget.bloodPressure || "--/--"} <span className="text-[12px] font-bold text-slate-400 tracking-normal">mmHg</span>
                                                        </span>
                                                    </div>
                                                    <Heartbeat size={40} weight="duotone" className="text-rose-500/20" />
                                                </div>
                                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temperature</span>
                                                        <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                                            {activeTarget.temperature || "--"} <span className="text-[12px] font-bold text-slate-400 tracking-normal">°C</span>
                                                        </span>
                                                    </div>
                                                    <Thermometer size={40} weight="duotone" className="text-slate-300" />
                                                </div>
                                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Heart Rate</span>
                                                        <span className="text-2xl font-black text-slate-800 tracking-tighter">
                                                            {activeTarget.heartRate || "--"} <span className="text-[12px] font-bold text-slate-400 tracking-normal">bpm</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-slate-300 text-sm font-bold opacity-50 uppercase tracking-widest">
                                                        Pulse
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Unified Action Footer */}
                        <div className="bg-slate-900 border-t border-slate-800 p-6 lg:p-8 shrink-0 relative z-10">
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 w-full">
                                
                                {/* Secondary Actions */}
                                <div className="flex gap-4 w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsReferralModalOpen(true)}
                                        disabled={isProcessing}
                                        className="h-14 px-5 border-slate-700 bg-slate-800 text-emerald-400 hover:bg-slate-700 hover:text-emerald-300 rounded-xl font-bold uppercase tracking-widest text-[12px] shrink-0"
                                    >
                                        <ArrowSquareOut size={18} weight="bold" className="mr-2" /> Referral
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        onClick={handleNoShow}
                                        disabled={isProcessing}
                                        className="h-14 px-5 border-rose-900/50 bg-rose-950/30 text-rose-400 hover:bg-rose-900 hover:text-rose-300 rounded-xl font-bold uppercase tracking-widest text-[12px] shrink-0"
                                    >
                                        <UserMinus size={18} weight="bold" className="mr-2" /> No Show
                                    </Button>
                                    
                                </div>

                                {/* Primary Action */}
                                <div className="w-full md:w-auto md:ml-auto">
                                    {inProgressVisit ? (
                                        <Button 
                                            onClick={handleServe} 
                                            disabled={isProcessing}
                                            className="w-full md:w-auto h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-black uppercase tracking-widest text-[14px] transition-all hover:-translate-y-1"
                                        >
                                            <CheckCircle size={20} weight="fill" className="mr-2" /> Complete Consultation
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={handleCallNext} 
                                            disabled={isProcessing || !nextVisit}
                                            className="w-full md:w-auto h-14 px-8 bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20 rounded-xl font-black uppercase tracking-widest text-[15px] transition-all hover:-translate-y-1 animate-pulse"
                                        >
                                            <SpeakerHigh size={20} weight="fill" className="mr-2" /> Call patient to clinic
                                        </Button>
                                    )}
                                </div>

                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Referral Modal */}
            <Dialog open={isReferralModalOpen} onOpenChange={setIsReferralModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Refer Patient</DialogTitle>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Choose the department you want to refer this patient to.
                        </p>
                    </DialogHeader>
                    
                    <div className="py-6">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Select Department</label>
                        <Select onValueChange={setTargetDeptId} value={targetDeptId}>
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold focus:ring-emerald-500">
                                <SelectValue placeholder="Choose target department..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                {allDepartments
                                    .filter(d => d.name.toUpperCase() !== department.toUpperCase())
                                    .map(dept => (
                                        <SelectItem key={dept.id} value={dept.id} className="font-bold text-slate-700 p-3 rounded-lg focus:bg-emerald-50 focus:text-emerald-900 group">
                                            {dept.name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="flex gap-3 pt-4 sm:justify-start">
                        <Button
                            className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-black uppercase tracking-widest"
                            onClick={handleReferral}
                            disabled={isProcessing || !targetDeptId}
                        >
                            {isProcessing ? "Processing..." : "Confirm Referral"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl border-slate-200 font-bold px-6"
                            onClick={() => setIsReferralModalOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
