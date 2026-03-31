"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useClinicQueue } from "@/app/(admin)/_hooks/use-clinic-queue";
import { VisitWithPatient } from "@/features/triage/types";
import { notify } from "@/lib/notify";
import { callPatient, servePatient, noShowPatient, restorePatient, transferPatient, CallerApiError } from "../api";
import { 
    Clock, Users, SpeakerHigh, UserMinus, CheckCircle, Hash, Phone, Heartbeat, Thermometer, Info, ArrowUpRight, ArrowSquareOut
} from "@phosphor-icons/react";
import { getDepartments } from "@/features/shared/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import { useCallerStore } from "../store/use-caller-store";
import { calculateAge } from "@/lib/utils";
import { useRouter } from "next/navigation";


export default function UserCallerDashboard({
    department,
    initialQueue = []
}: {
    department: string;
    initialQueue?: VisitWithPatient[];
}) {
    const router = useRouter();
    const isAvailable = true;
    const { 
        activeTab, setActiveTab, 
        isProcessing, setIsProcessing, 
        allDepartments, setDepartments, 
        isReferralModalOpen, setReferralModalOpen,
        targetDeptId, setTargetDeptId,
        resetReferral
    } = useCallerStore();

    useEffect(() => {
        getDepartments().then(res => {
            if (res.success) setDepartments(res.data);
        });
    }, [setDepartments]);

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

    const handleCallerApiError = (error: unknown, fallbackMessage: string) => {
        if (error instanceof CallerApiError) {
            if (error.code === "CLAIM_CONFLICT") {
                notify.error("Patient already claimed by another caller.", {
                    description: "Queue refreshed to show latest ownership.",
                });
                router.refresh();
                return;
            }

            if (error.code === "CLAIM_FORBIDDEN_SCOPE") {
                notify.error("Not allowed for this station/department.", {
                    description: "Your account assignment does not match this patient.",
                });
                return;
            }

            notify.error(error.message || fallbackMessage);
            return;
        }

        notify.error(fallbackMessage);
    };

    // Action Handlers
    const handleCallNext = async () => {
        if (!nextVisit) return notify.info("No more patients in the waiting list.");
        if (inProgressVisit) return notify.error("Please Mark Served or No Show the current patient first.");
        
        setIsProcessing(true);
        try {
            await callPatient(nextVisit.id);
            notify.success(`Calling patient P-${nextVisit.ticketNumber?.toString() ?? 'N/A'}`);
        } catch (error) {
            handleCallerApiError(error, "Failed to call patient.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleServe = async () => {
        if (!inProgressVisit) return notify.error("No active patient to serve.");
        setIsProcessing(true);
        try {
            await servePatient(inProgressVisit.id);
            notify.success("Patient consultation completed.");
        } catch (error) {
            handleCallerApiError(error, "Failed to mark patient as served.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNoShow = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return notify.error("No patient selected to mark as No Show.");
        setIsProcessing(true);
        try {
            await noShowPatient(targetVisit.id);
            notify.error(`Patient P-${targetVisit.ticketNumber?.toString() ?? 'N/A'} marked as NO SHOW`);
        } catch (error) {
            handleCallerApiError(error, "Failed to process No Show.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReferral = async () => {
        const targetVisit = inProgressVisit || nextVisit;
        if (!targetVisit) return notify.error("No patient selected for referral.");
        if (!targetDeptId) return notify.error("Please select a target department.");

        setIsProcessing(true);
        try {
            await transferPatient(targetVisit.id, targetDeptId);
            notify.success("Patient referred successfully.");
            resetReferral();
        } catch (error) {
            handleCallerApiError(error, "An error occurred during referral.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRestore = async (visitId: string) => {
        setIsProcessing(true);
        try {
            await restorePatient(visitId);
            notify.success("Patient restored to active queue.");
        } catch (error) {
            handleCallerApiError(error, "Failed to restore patient.");
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-background p-6 lg:p-8 gap-6">
            
            {/* LEFT PANE: Waitlist (35%) */}
            <div className="flex flex-col w-full lg:w-[35%] xl:w-[30%] bg-card rounded-xl border border-border overflow-hidden shrink-0">
                {/* Header */}
                <div className="px-6 py-6 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-foreground">{department}</h2>
                        <div className="flex items-center gap-3 mt-1">
                             <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {waitingList.length} Active
                             </span>
                             <span className="w-1 h-1 rounded-full bg-border" />
                             <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> {noShowList.length} No Shows
                             </span>
                        </div>
                    </div>
                    {/* Status Display */}
                    <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border shadow-sm">
                        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-destructive'}`} />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
                            {isAvailable ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border bg-background">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                            activeTab === "pending" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Active ({waitingList.length})
                        {activeTab === "pending" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("referrals")}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                            activeTab === "referrals" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Referrals ({referralList.length})
                        {activeTab === "referrals" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("noshow")}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                            activeTab === "noshow" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        No Shows ({noShowList.length})
                        {activeTab === "noshow" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-destructive" />
                        )}
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                    {activeTab === "pending" ? (
                        waitingList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <CheckCircle size={48} className="mb-4 text-primary/20" weight="duotone" />
                                <p className="text-lg font-bold text-foreground">Queue is Clear</p>
                                <p className="text-sm font-medium text-muted-foreground mt-1">No patients waiting for this clinic.</p>
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
                                            className={`p-5 border-b border-border relative transition-all group ${
                                                isNext ? "bg-muted/30" : "bg-transparent hover:bg-muted/10"
                                            }`}
                                        >
                                            {isNext && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-base font-bold ${isNext ? "text-primary" : "text-muted-foreground"}`}>
                                                        {visit.ticketNumber ? `#${visit.ticketNumber}` : 'NO TICKET'}
                                                    </span>
                                                    {isNext && (
                                                        <span className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/20">
                                                            Next
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold border border-border">
                                                    <Clock size={12} weight="bold" /> {waitStr}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground transition-colors group-hover:text-primary">
                                                        {visit.patient.lastName}, <span className="text-muted-foreground font-medium">{visit.patient.firstName}</span>
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
                                <ArrowUpRight size={48} className="mb-4 text-primary/20" weight="duotone" />
                                <p className="text-lg font-bold text-foreground">No Referrals</p>
                                <p className="text-sm font-medium text-muted-foreground mt-1">No incoming referrals right now.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {referralList.map((visit, index) => {
                                    const isNext = index === 0 && !inProgressVisit && waitingList.length === 0;
                                    return (
                                        <div 
                                            key={visit.id} 
                                            className={`p-5 border-b border-border relative transition-all group ${
                                                isNext ? "bg-muted/30" : "bg-transparent hover:bg-muted/10"
                                            }`}
                                        >
                                            {isNext && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-base font-bold ${isNext ? "text-primary" : "text-muted-foreground"}`}>
                                                    {visit.ticketNumber ? `#${visit.ticketNumber}` : 'NO TICKET'}
                                                </span>
                                                <span className="bg-muted text-muted-foreground text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-border">
                                                    From: {visit.referredFrom?.name || "N/A"}
                                                </span>
                                            </div>
                                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                                {visit.patient.lastName}, <span className="text-muted-foreground font-medium">{visit.patient.firstName}</span>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        noShowList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <UserMinus size={48} className="mb-4 text-muted/30" weight="duotone" />
                                <p className="text-lg font-bold text-muted-foreground">No Show list empty</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {noShowList.map((visit) => (
                                    <div 
                                        key={visit.id} 
                                        className="p-5 border-b border-border bg-card/50 hover:bg-muted/10 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-base font-bold text-destructive">
                                                {visit.ticketNumber ? `#${visit.ticketNumber}` : 'NO TICKET'}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore(visit.id)}
                                                disabled={isProcessing}
                                                className="h-8 px-3 border-border bg-background text-foreground hover:bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest"
                                            >
                                                Restore
                                            </Button>
                                        </div>
                                        <span className="font-bold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                            {visit.patient.lastName}, <span className="font-medium">{visit.patient.firstName}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* RIGHT PANE: Active Consultation (65%) */}
            <div className="flex flex-col flex-1 bg-card rounded-xl border border-border overflow-hidden relative shadow-sm">
                
                {(!inProgressVisit && !nextVisit) ? (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-muted/5">
                        <div className="w-20 h-20 bg-background rounded-full border border-border flex items-center justify-center mb-6 shadow-sm">
                            <Users size={32} className="text-muted/30" weight="duotone" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-1 tracking-tight">You are all caught up!</h2>
                        <p className="text-muted-foreground text-sm">There are currently no patients assigned to {department}.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10 relative w-full bg-background/50">
                            <div className="max-w-4xl mx-auto">
                                
                                {/* Status Header */}
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-border">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mr-auto p-1 border-l-2 border-primary/30 pl-3">
                                        {inProgressVisit ? "Active Consultation" : "Up Next"}
                                    </h3>
                                    {inProgressVisit ? (
                                        <div className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">In Progress</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 bg-orange-500/5 text-orange-600 px-3 py-1.5 rounded-full border border-orange-500/10">
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Waiting to be called</span>
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
                                                <div className="flex flex-col justify-center items-center w-40 h-40 shrink-0 bg-white rounded-3xl shadow-xl border border-emerald-100 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-emerald-50/50 group-hover:bg-emerald-50 transition-colors" />
                                                    <div className="relative z-10 flex flex-col items-center">
                                                        <span className="text-[11px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Ticket No.</span>
                                                        <span className="text-5xl font-black text-emerald-900 tracking-tighter">
                                                            {activeTarget.ticketNumber ? `#${activeTarget.ticketNumber}` : '---'}
                                                        </span>
                                                    </div>
                                                </div>
 
                                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3 truncate w-full">
                                                        {activeTarget.patient.firstName} <span className="text-emerald-800">{activeTarget.patient.lastName}</span>
                                                    </h1>
                                                    
                                                    <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold text-slate-500 mb-4">
                                                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                            <Hash size={16} className="text-emerald-600" /> <span className="text-slate-400">ID:</span> {activeTarget.patient.id.split('-')[0].toUpperCase()}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-slate-600">
                                                            {activeTarget.patient.gender} • {calculateAge(activeTarget.patient.dateOfBirth) ?? '??'} years old
                                                        </span>
                                                        <span className="bg-emerald-600 text-white text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full shadow-sm shadow-emerald-200">
                                                            {activeTarget.classification || "REGULAR"}
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
                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                <Info size={16} className="text-primary" /> Intake Information
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-primary/50">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Chief Complaint</span>
                                                    <p className="text-sm font-medium text-foreground leading-relaxed italic">
                                                        &quot;{activeTarget.chiefComplaint || "No complaint recorded."}&quot;
                                                    </p>
                                                </div>
                                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-destructive flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Blood Pressure</span>
                                                        <span className="text-2xl font-bold text-destructive tracking-tighter">
                                                            {activeTarget.bloodPressure || "--/--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">mmHg</span>
                                                        </span>
                                                    </div>
                                                    <Heartbeat size={32} weight="duotone" className="text-destructive/20" />
                                                </div>
                                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-primary flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Temperature</span>
                                                        <span className="text-2xl font-bold text-foreground tracking-tighter">
                                                            {activeTarget.temperature || "--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">°C</span>
                                                        </span>
                                                    </div>
                                                    <Thermometer size={32} weight="duotone" className="text-primary/20" />
                                                </div>
                                                <div className="bg-card border border-border p-6 rounded-xl shadow-sm border-t-2 border-t-blue-500/50 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Heart Rate</span>
                                                        <span className="text-2xl font-bold text-foreground tracking-tighter">
                                                            {activeTarget.heartRate || "--"} <span className="text-xs font-medium text-muted-foreground tracking-normal ml-1">bpm</span>
                                                        </span>
                                                    </div>
                                                    <Info size={32} weight="duotone" className="text-blue-500/10" />
                                                </div>
                                            </div>

                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Unified Action Footer */}
                        <div className="bg-background/80 backdrop-blur-md border-t border-border p-6 lg:p-8 shrink-0 relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 w-full">
                                
                                {/* Secondary Actions */}
                                <div className="flex gap-3 w-full md:w-auto justify-start">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setReferralModalOpen(true)}
                                        disabled={isProcessing}
                                        className="h-12 px-6 border-border bg-background text-foreground hover:bg-muted rounded-xl font-bold uppercase tracking-widest text-[11px] shrink-0 transition-all active:scale-95 shadow-sm"
                                    >
                                        <ArrowSquareOut size={16} weight="bold" className="mr-2 text-primary" /> Referral
                                    </Button>
 
                                    <Button 
                                        variant="outline" 
                                        onClick={handleNoShow}
                                        disabled={isProcessing}
                                        className="h-12 px-6 border-border bg-background text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 rounded-xl font-bold uppercase tracking-widest text-[11px] shrink-0 transition-all active:scale-95 shadow-sm"
                                    >
                                        <UserMinus size={16} weight="bold" className="mr-2" /> No Show
                                    </Button>
                                    
                                </div>
 
                                {/* Primary Action */}
                                <div className="w-full md:w-auto md:ml-auto">
                                    {inProgressVisit ? (
                                        <Button 
                                            onClick={handleServe} 
                                            disabled={isProcessing}
                                            className="w-full md:w-auto h-12 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                        >
                                            <CheckCircle size={18} weight="fill" className="mr-2" /> Mark Served
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={handleCallNext} 
                                            disabled={isProcessing || !nextVisit}
                                            className="w-full md:w-auto h-12 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] animate-in fade-in zoom-in duration-300"
                                        >
                                            <SpeakerHigh size={18} weight="fill" className="mr-2" /> Call Patient
                                        </Button>
                                    )}
                                </div>
 
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Referral Modal */}
            <Dialog open={isReferralModalOpen} onOpenChange={setReferralModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-8 border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-foreground tracking-tight">Refer Patient</DialogTitle>
                        <p className="text-muted-foreground font-medium text-sm mt-1">
                            Choose the department you want to refer this patient to.
                        </p>
                    </DialogHeader>
                    
                    <div className="py-8">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Target Department</label>
                        <Select onValueChange={setTargetDeptId} value={targetDeptId}>
                            <SelectTrigger className="h-12 rounded-xl border-border bg-muted/30 font-bold focus:ring-primary/20">
                                <SelectValue placeholder="Choose department..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-xl">
                                {allDepartments
                                    .filter(d => d.name.toUpperCase() !== department.toUpperCase())
                                    .map(dept => (
                                        <SelectItem key={dept.id} value={dept.id} className="font-bold text-foreground p-3 rounded-lg focus:bg-primary/5 focus:text-primary group">
                                            {dept.name}
                                        </SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="flex gap-3 sm:justify-end">
                        <Button
                            variant="ghost"
                            className="h-12 rounded-xl border-border font-bold px-6"
                            onClick={() => setReferralModalOpen(false)}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest px-8 shadow-md shadow-primary/10"
                            onClick={handleReferral}
                            disabled={isProcessing || !targetDeptId}
                        >
                            {isProcessing ? "Processing..." : "Confirm Referral"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
