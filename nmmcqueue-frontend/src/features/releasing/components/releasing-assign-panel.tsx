"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VisitWithPatient } from "@/features/triage/types";
import { notify } from "@/shared/lib/notify";
import { calculateAge } from "@/shared/lib/utils";
import { Department, PriorityCategory } from "@/shared/types/models";
import { Printer, User, WarningCircle, X, Play } from "@phosphor-icons/react";
import { useMemo, useState, useTransition } from "react";
import { assignTicket, noShowTicket, linkPatient } from "../actions";
import { SearchableSelect } from "@/components/ui/searchable-select";

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
    const [hospitalId, setHospitalId] = useState("");
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
        setHospitalId("");
        setNotes("");
        
    }

    const queueOptions = useMemo(() => {
        if (!activeDepartment) return [];
        // Normalize the department key the same way the backend does
        const normalizedKey = activeDepartment.name.trim().toUpperCase();
        const opts = queueOptionsByDepartment[normalizedKey] || [];
        
        // Debug log
        if (process.env.NODE_ENV === 'development') {
        }
        
        return opts;
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

    const handleNoShow = () => {
        startTransition(async () => {
            const res = await noShowTicket(selectedPatient.id);
            if (res.success) {
                notify.success("Patient marked as no-show");
                onAssignComplete();
            } else {
                if (res?.code === "CLAIM_CONFLICT") {
                    notify.error("Unable to mark no-show.", {
                        description: "Patient ownership changed. Queue refreshed.",
                    });
                    onAssignComplete();
                } else {
                    notify.error(res?.message || res?.error || "Failed to update status");
                }
            }
        });
    };

    const handleLinkPatient = () => {
        if (!hospitalId.trim()) {
            notify.error("Hospital ID required", { description: "Enter the verified hospital ID before linking." });
            return;
        }

        startTransition(async () => {
            const res = await linkPatient(selectedPatient.id, hospitalId.trim());
            if (res?.success) {
                notify.success("Patient identity verified", {
                    description: `Visit linked to official hospital ID ${hospitalId.trim()}.`
                });
                onAssignComplete();
            } else {
                notify.error(res?.message || res?.error || "Failed to link official patient record");
            }
        });
    };

    const handleAssign = () => {

        // Validate patient is in correct status
        if (selectedPatient.status !== 'IN_WINDOW') {
            notify.error("Patient not ready", { description: "Please call the patient to window first." });
            return;
        }

        if (!selectedDepartmentId) {
            notify.error("Department not selected", { description: "Choose a clinic department first." });
            return;
        }

        if (!autoQueueOption) {
            notify.error("No queue option configured", {
                description: `The ${activeDepartment?.name || 'selected'} department has no queue categories. Please go to Admin > Departments to add queue options.`
            });
            return;
        }

        startTransition(async () => {
            try {

                const res = await assignTicket(selectedPatient.id, selectedDepartmentId, autoQueueOption.id);
                

                if (res?.success && res?.data) {
                    // Patient successfully assigned to clinic queue
                    notify.success(
                        "Ticket assigned to clinic",
                        {
                            description: `Patient ${res.data.patientFullName} -> ${activeDepartment?.name || 'clinic'} (Service Ticket #${res.data.serviceTicket})`
                        }
                    );
                } else {
                    notify.error(res?.error || "Ticket assignment failed", {
                        description: "Please try again or contact support."
                    });
                }
            } catch (error) {
                notify.error("Error assigning ticket", {
                    description: error instanceof Error ? error.message : "Unknown error occurred"
                });
            } finally {
                onAssignComplete();
            }
        });
    };

    const isNoShow = selectedPatient.status === 'NO_SHOW';
    const isInWindow = selectedPatient.status === 'IN_WINDOW';
    const isReadyForAssignment = isInWindow && selectedDepartmentId && autoQueueOption;

    return (
        <div className="bg-card rounded-xl border border-border h-full flex flex-col pt-3 sm:pt-4 overflow-hidden shadow-sm">

            {/* Header */}
            <div className="px-3 sm:px-6 lg:px-8 pb-3 sm:pb-4 flex items-center justify-between border-b border-border">
                <div className="flex flex-col">
                    <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Patient Verification</h3>
                    <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Routing & Assignment</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
                >
                    <X size={18} weight="bold" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 custom-scrollbar shrink-0">

                {/* Status Alert */}
                {isNoShow && (
                    <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2.5 text-destructive font-bold text-xs">
                        <WarningCircle size={16} weight="fill" />
                        Patient was previously marked as NO-SHOW.
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-5 relative mb-4 sm:mb-6">
                    <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-background rounded-lg border border-border flex items-center justify-center shrink-0">
                            <User size={22} weight="bold" className="text-muted-foreground/40" />
                        </div>
                        <div className="min-w-0 pr-4">
                            <h2 className="text-base sm:text-xl font-bold text-foreground leading-tight truncate">
                                {selectedPatient.patient.firstName} {selectedPatient.patient.middleName ? `${selectedPatient.patient.middleName} ` : ''}{selectedPatient.patient.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    Triage Ticket: <strong className="text-primary">{selectedPatient.triageTicket ? `#${selectedPatient.triageTicket}` : 'NO TICKET'}</strong>
                                </span>
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

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded border ${selectedPatient.classification === 'PRIORITY' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                            {selectedPatient.classification}
                        </span>
                    </div>
                </div>

                {/* Personal Information & Demographics */}
                <div className="bg-card border border-border rounded-xl p-3 sm:p-5 lg:p-6 mb-5 sm:mb-7 shadow-sm">
                    <h4 className="text-xs sm:text-sm font-extrabold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Personal Information</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Date of Birth</span>
                            <p className="text-xs font-extrabold text-foreground">
                                {selectedPatient.patient.dateOfBirth ? new Date(selectedPatient.patient.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '---'}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Civil Status</span>
                            <p className="text-xs font-extrabold text-foreground uppercase">{selectedPatient.patient.civilStatus || '---'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Religion</span>
                            <p className="text-xs font-extrabold text-foreground uppercase">{selectedPatient.patient.religion || '---'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Contact Number</span>
                            <p className="text-xs font-extrabold text-primary">{selectedPatient.patient.contactNo || 'NONE'}</p>
                        </div>
                        <div className="col-span-full space-y-1 pt-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Home Address</span>
                            <p className="text-xs font-bold text-foreground leading-relaxed italic opacity-90">
                                {selectedPatient.patient.address || 'No address provided'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Triage Handoff Details */}
                <div className="bg-primary/[0.03] border border-primary/10 rounded-xl p-3 sm:p-5 lg:p-6 mb-5 sm:mb-7 shadow-sm">
                    <h4 className="text-xs sm:text-sm font-extrabold text-primary/80 uppercase tracking-wider mb-3 sm:mb-4">Triage Endorsement</h4>
                    <div className="space-y-2.5 sm:space-y-3.5">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4 pb-2 border-b border-primary/10">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Disposition</span>
                            <span className="text-xs sm:text-sm font-extrabold text-foreground text-right">{selectedPatient.disposition || "Not set"}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4 pb-2 border-b border-primary/10">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Classification</span>
                            <span className="text-xs sm:text-sm font-extrabold text-foreground text-right">{selectedPatient.classification}</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:gap-4">
                            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Clinic Dept</span>
                            <span className="text-xs sm:text-sm font-extrabold text-foreground text-right">{triageAssignedDepartmentName}</span>
                        </div>
                    </div>
                </div>


                {/* Quick Actions — No-Show / Call Status */}
                <div className="mb-6 sm:mb-8">
                    <Button
                        variant="outline"
                        onClick={handleNoShow}
                        disabled={isPending || isNoShow}
                        className="flex-1 h-10 sm:h-11 border-border text-muted-foreground font-bold uppercase tracking-widest text-[10px] sm:text-xs gap-2 rounded-xl hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all shadow-sm"
                    >
                        <X size={16} weight="bold" />
                        Mark No Show
                    </Button>
                </div>

                {/* Vitals Ribbon */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
                    <div className="bg-card border border-border p-2.5 sm:p-3 rounded-lg flex flex-col justify-center">
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Blood Pressure</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-sm sm:text-lg font-bold tracking-tight ${selectedPatient.bloodPressure ? 'text-foreground' : 'text-muted/30'}`}>
                                {selectedPatient.bloodPressure || "--/--"}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">mmHg</span>
                        </div>
                    </div>
                    <div className="bg-card border border-border p-2.5 sm:p-3 rounded-lg flex flex-col justify-center">
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Temperature</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-sm sm:text-lg font-bold tracking-tight ${selectedPatient.temperature ? 'text-foreground' : 'text-muted/30'}`}>
                                {selectedPatient.temperature || "--"}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">°C</span>
                        </div>
                    </div>
                </div>

                {/* Routing Selects */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    {selectedPatient.kioskRegistrationType === "UNREGISTERED" && (
                        <div className="space-y-2">
                            <Label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Verified Hospital ID</Label>
                            <div className="flex gap-2">
                                <input
                                    value={hospitalId}
                                    onChange={(e) => setHospitalId(e.target.value)}
                                    placeholder="Enter official hospital ID"
                                    className="flex-1 h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleLinkPatient}
                                    disabled={isPending}
                                    className="h-10 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Link
                                </Button>
                            </div>
                        </div>
                    )}
                    {!selectedPatient.departmentId && (
                        <div>
                            <Label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2 block">Clinic / Department</Label>
                            <SearchableSelect
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                                value={selectedDepartmentId}
                                onSelect={setSelectedDepartmentId}
                                placeholder="Select Department..."
                                searchPlaceholder="Search department..."
                                className="h-10 text-xs sm:text-sm font-bold rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* Internal Notes */}
                <div className="mb-6 sm:mb-8">
                    <Label className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2 block">Internal Routing Notes</Label>
                    <textarea
                        className="w-full bg-muted/50 border border-border text-foreground text-xs font-medium rounded-lg p-2.5 sm:p-3 outline-none focus:bg-background focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all shadow-inner resize-none h-20 sm:h-24 placeholder:text-muted-foreground/50 italic"
                        placeholder="Add instructions for receiving clinic..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Bottom Global Actions */}
            <div className="bg-muted/10 border-t border-border p-3 sm:p-5 lg:p-6 flex items-center justify-between gap-3 sm:gap-4 mt-auto">
                <button
                    onClick={onClose}
                    className="text-[9px] sm:text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-all"
                >
                    Release
                </button>

                <div className="flex gap-2 w-auto justify-end">
                    <Button
                        disabled={!isReadyForAssignment || isPending}
                        onClick={handleAssign}
                        title={
                            !isInWindow
                                ? "Patient must be called to window first"
                                : !selectedDepartmentId
                                ? "Select a department"
                                : !autoQueueOption
                                ? "No queue options configured for this department"
                                : "Print and assign to clinic queue"
                        }
                        className="h-9 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] sm:text-xs px-4 sm:px-6 font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md shadow-primary/10 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? "Routing..." : (
                            <>
                                <Printer size={16} weight="bold" />
                                <span className="hidden sm:inline">Print & Assign</span>
                                <span className="sm:hidden">Assign</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
    );
}


