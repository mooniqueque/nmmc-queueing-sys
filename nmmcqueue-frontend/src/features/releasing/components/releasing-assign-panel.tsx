"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VisitWithPatient } from "@/features/triage/types";
import { calculateAge } from "@/lib/utils";
import { Department, PriorityCategory } from "@/types/models";
import { BellRinging, Phone, Printer, User, WarningCircle, X } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { assignTicket, callTicket, noShowTicket } from "../actions";

interface ReleasingAssignPanelProps {
    selectedPatient: VisitWithPatient;
    departments: Department[];
    queueOptionsByDepartment: Record<string, PriorityCategory[]>;
    badges: string[];
    onClose: () => void;
    onAssignComplete: () => void;
}

export function ReleasingAssignPanel({
    selectedPatient,
    departments,
    queueOptionsByDepartment,
    badges,
    onClose,
    onAssignComplete
}: ReleasingAssignPanelProps) {
    const [selectedDepartmentId, setSelectedDepartmentId] = useState(selectedPatient.departmentId || "");
    const [notes, setNotes] = useState("");
    const [isPending, startTransition] = useTransition();

    const activeDepartment = departments.find(d => d.id === selectedDepartmentId);
    const triageAssignedDepartmentName = useMemo(() => {
        if (selectedPatient.department?.name) return selectedPatient.department.name;
        if (selectedPatient.departmentId) {
            return departments.find(d => d.id === selectedPatient.departmentId)?.name || "Assigned by Triage";
        }
        return "Not yet assigned";
    }, [departments, selectedPatient.department?.name, selectedPatient.departmentId]);

    const [prevPatientId, setPrevPatientId] = useState(selectedPatient.id);
    
    // Sync state when selectedPatient changes (to avoid useEffect cascading render warning)
    if (selectedPatient.id !== prevPatientId) {
        setPrevPatientId(selectedPatient.id);
        setSelectedDepartmentId(selectedPatient.departmentId || "");
        setNotes("");
    }

    const queueOptions = useMemo(() => {
        if (!activeDepartment) return [];
        return queueOptionsByDepartment[activeDepartment.name.toUpperCase()] || [];
    }, [activeDepartment, queueOptionsByDepartment]);

    // Intelligent Recommendation based on Triage
    const recommendedOption = useMemo(() => {
        // If we have dynamic options, try to match by name or priority status
        if (queueOptions.length > 0) {
            if (badges.includes("ER-REF") || selectedPatient.disposition?.toUpperCase().includes("ER")) {
                const opt = queueOptions.find(o => o.code === "ER-REF" || o.name.toUpperCase().includes("ER"));
                if (opt) return opt;
            }
            if (badges.includes("SENIOR") || badges.includes("CHILD")) {
                const opt = queueOptions.find(o => o.isPriority);
                if (opt) return opt;
            }
        }
        return null;
    }, [badges, selectedPatient.disposition, queueOptions]);

    const autoQueueOption = useMemo(() => {
        if (!selectedDepartmentId || queueOptions.length === 0) return null;

        if (selectedPatient.classification === "PRIORITY") {
            return recommendedOption ?? queueOptions.find((opt) => opt.isPriority) ?? queueOptions[0];
        }

        return queueOptions.find((opt) => !opt.isPriority) ?? recommendedOption ?? queueOptions[0];
    }, [selectedDepartmentId, queueOptions, selectedPatient.classification, recommendedOption]);

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
        if (!selectedDepartmentId) return;
        if (!autoQueueOption) {
            toast.error("No queue option configured for this department");
            return;
        }

        startTransition(async () => {
            const res = await assignTicket(selectedPatient.id, selectedDepartmentId, autoQueueOption.id);
            if (res?.success && res?.data) {
                // Auto-print clinic ticket
                if (res.data.ticketNumber) {
                    const ticketNum = res.data.ticketNumber.toString().padStart(3, '0');
                    const clinicName = activeDepartment?.name || "Clinic";
                    const html = `
                        <div class="header">Northern Mindanao Medical Center</div>
                        <div class="sub-header">Registration Window</div>
                        <div class="ticket-label">${clinicName} Queue Number</div>
                        <div class="ticket-number">#${ticketNum}</div>
                        
                        <div class="date-time">${new Date().toLocaleString()}</div>
                        <div class="footer">Please proceed to ${clinicName} and wait for your number.</div>
                    `;
                    import('@/lib/print').then(({ printThermalReceipt }) => printThermalReceipt(html));
                }
                toast.success("Ticket printed and assigned successfully");
            } else {
                toast.error(res?.error || "Failed to assign ticket");
            }
            onAssignComplete();
        });
    };

    const isCalled = selectedPatient.status === 'IN_PROGRESS';
    const isNoShow = selectedPatient.status === 'NO_SHOW';

    return (
        <div className="bg-card rounded-xl border border-border h-full flex flex-col pt-4 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="px-6 lg:px-8 pb-4 flex items-center justify-between border-b border-border">
                <div className="flex flex-col">
                    <h3 className="text-base font-bold text-foreground tracking-tight">Patient Verification</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Routing & Assignment</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                >
                    <X size={18} weight="bold" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 custom-scrollbar shrink-0">

                {/* Status Alert */}
                {isNoShow && (
                    <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2.5 text-destructive font-bold text-xs">
                        <WarningCircle size={16} weight="fill" />
                        Patient was previously marked as NO-SHOW.
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-muted/30 border border-border rounded-xl p-5 relative mb-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 bg-background rounded-lg border border-border flex items-center justify-center shrink-0">
                            <User size={28} weight="bold" className="text-muted-foreground/40" />
                        </div>
                        <div className="min-w-0 pr-6">
                            <h2 className="text-xl font-bold text-foreground leading-tight truncate">
                                {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                <span>Ticket: <strong className="text-primary">{selectedPatient.ticketNumber ? `#${selectedPatient.ticketNumber.toString().padStart(3, '0')}` : 'NO TICKET'}</strong></span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{selectedPatient.patient.gender}</span>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{calculateAge(selectedPatient.patient.dateOfBirth) ?? '??'}y</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Chief Complaint</span>
                        <p className="text-xs font-medium text-foreground italic leading-relaxed">
                            &ldquo;{selectedPatient.chiefComplaint || 'No complaint specified'}&rdquo;
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${selectedPatient.classification === 'PRIORITY' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {selectedPatient.classification}
                        </span>
                        {badges.map(b => (
                            <span key={b} className="bg-muted text-muted-foreground text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-border">
                                {b}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Triage Handoff Details */}
                <div className="bg-card border border-border rounded-xl p-5 lg:p-6 mb-7 shadow-sm">
                    <h4 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-4">Triage Endorsement</h4>
                    <div className="space-y-3.5">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4 pb-2 border-b border-border/60">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Acuity / Disposition</span>
                            <span className="text-sm lg:text-base font-extrabold text-foreground text-right">{selectedPatient.disposition || "Not set"}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4 pb-2 border-b border-border/60">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Classification</span>
                            <span className="text-sm lg:text-base font-extrabold text-foreground text-right">{selectedPatient.classification}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Clinic Department</span>
                            <span className="text-sm lg:text-base font-extrabold text-foreground text-right">{triageAssignedDepartmentName}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Call / No-Show) */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {!isCalled ? (
                        <Button
                            onClick={handleCall}
                            disabled={isPending}
                            className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs gap-2 rounded-xl shadow-sm"
                        >
                            <BellRinging size={18} weight="bold" />
                            Call Patient
                        </Button>
                    ) : (
                        <div className="h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] animate-pulse">
                            <Phone size={18} weight="bold" />
                            Currently Serving
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleNoShow}
                        disabled={isPending || isNoShow}
                        className="h-12 border-border text-muted-foreground font-bold uppercase tracking-widest text-xs gap-2 rounded-xl hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all shadow-sm"
                    >
                        <X size={16} weight="bold" />
                        No Show
                    </Button>
                </div>

                {/* Vitals Ribbon */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-card border border-border p-3 rounded-lg flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Blood Pressure</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-lg font-bold tracking-tight ${selectedPatient.bloodPressure ? 'text-foreground' : 'text-muted/30'}`}>
                                {selectedPatient.bloodPressure || "--/--"}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">mmHg</span>
                        </div>
                    </div>
                    <div className="bg-card border border-border p-3 rounded-lg flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Temperature</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-lg font-bold tracking-tight ${selectedPatient.temperature ? 'text-foreground' : 'text-muted/30'}`}>
                                {selectedPatient.temperature || "--"}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">°C</span>
                        </div>
                    </div>
                </div>

                {/* Routing Selects */}
                <div className="space-y-4 mb-8">
                    {!selectedPatient.departmentId && (
                        <div>
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Clinic / Department</Label>
                            <select
                                className="w-full bg-background border border-border text-foreground text-sm font-bold rounded-lg h-10 px-4 appearance-none outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                                value={selectedDepartmentId}
                                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                            >
                                <option value="" disabled>Select Department...</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Internal Notes */}
                <div className="mb-8">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Internal Routing Notes</Label>
                    <textarea
                        className="w-full bg-muted/50 border border-border text-foreground text-xs font-medium rounded-lg p-3 outline-none focus:bg-background focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all shadow-inner resize-none h-24 placeholder:text-muted-foreground/50 italic"
                        placeholder="Add instructions for receiving clinic..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Bottom Global Actions */}
            <div className="bg-muted/10 border-t border-border p-5 lg:p-6 flex items-center justify-between gap-4 mt-auto">
                <button
                    onClick={onClose}
                    className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all"
                >
                    Clear Selection
                </button>

                <div className="flex gap-2 w-auto justify-end">
                    <Button
                        disabled={!selectedDepartmentId || !autoQueueOption || isPending || !isCalled}
                        onClick={handleAssign}
                        className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-6 font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-primary/10 gap-2 min-w-45"
                    >
                        {isPending ? "Routing..." : (
                            <>
                                <Printer size={18} weight="bold" /> Print & Assign
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
    );
}
