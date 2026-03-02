"use client";

import { VisitWithPatient } from "@/app/(staffs)/triage/_types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Department } from "@/types/models";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { assignTicket } from "../_actions/clerk-actions";

interface ClerkFormProps {
    selectedPatient: VisitWithPatient | null;
    setSelectedPatient: (patient: VisitWithPatient | null) => void;
    departments: Department[];
    queueOptionsByDepartment: Record<string, string[]>;
}

const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];

export function ClerkForm({
    selectedPatient,
    setSelectedPatient,
    departments = [],
    queueOptionsByDepartment = {}
}: ClerkFormProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedQueueOption, setSelectedQueueOption] = useState("");
    const [isPending, startTransition] = useTransition();

    if (!selectedPatient) {
        return (
            <div className="flex h-full items-center justify-center p-6 bg-slate-50/50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MagnifyingGlass size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700">No Target Selected</h2>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Please select a patient ticket from the &quot;Waiting for Window&quot; queue to review demographic data and assign them to a clinic department.
                    </p>
                </div>
            </div>
        );
    }

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
            setSelectedPatient(null);
            setSelectedDepartmentId("");
            setSelectedQueueOption("");
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden p-6 gap-6">
            <h2 className="text-2xl font-bold text-emerald-800">Process Ticket: <span className="text-emerald-600">#{selectedPatient.ticketNumber}</span></h2>

            {/* TWO COLUMN LAYOUT inside the Content Slot */}
            <div className="flex gap-6 h-full">

                {/* LEFT: Demographics & Triage Record */}
                <div className="flex-1 overflow-y-auto space-y-4">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-emerald-900 text-lg">Patient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-2 gap-y-4 gap-x-6">
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">First Name</span><span className="font-medium text-slate-900">{selectedPatient.patient.firstName}</span></div>
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Last Name</span><span className="font-medium text-slate-900">{selectedPatient.patient.lastName}</span></div>
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Date of Birth</span><span className="font-medium text-slate-900">{new Date(selectedPatient.patient.dateOfBirth).toLocaleDateString()}</span></div>
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Gender</span><span className="font-medium text-slate-900">{selectedPatient.patient.gender}</span></div>
                            <div className="col-span-2"><span className="block text-xs font-semibold text-slate-500 uppercase">Address</span><span className="font-medium text-slate-900">{selectedPatient.patient.address}</span></div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-slate-50 border-b pb-4">
                            <CardTitle className="text-emerald-900 text-lg">Triage Assesment</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-3 gap-y-4 gap-x-6">
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Blood Pressure</span><span className="font-medium text-emerald-700">{selectedPatient.bloodPressure || 'N/A'}</span></div>
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Heart Rate</span><span className="font-medium text-emerald-700">{selectedPatient.heartRate || 'N/A'}</span></div>
                            <div><span className="block text-xs font-semibold text-slate-500 uppercase">Temp</span><span className="font-medium text-emerald-700">{selectedPatient.temperature || 'N/A'}</span></div>

                            <div className="col-span-3 mt-2"><span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chief Complaint</span><div className="bg-slate-50 p-3 rounded border text-sm text-slate-800">{selectedPatient.chiefComplaint || 'No complaint details provided.'}</div></div>
                            <div className="col-span-3 mt-2"><span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Triage Remarks</span><div className="bg-slate-50 p-3 rounded border text-sm text-slate-800">{selectedPatient.triageRemarks || 'No additional remarks.'}</div></div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Department Assignment */}
                <div className="w-80 shrink-0 flex flex-col gap-4">
                    {/* Choose Department */}
                    <Card className="shadow-sm border-slate-200 flex-1 flex flex-col items-stretch overflow-hidden">
                        <CardHeader className="border-b bg-slate-50">
                            <CardTitle className="text-lg text-emerald-900">Assign Department</CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-4 content-start auto-rows-max flex flex-col gap-2">
                            <Input
                                placeholder="Search departments..."
                                className="bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {filteredDepartments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        onClick={() => setSelectedDepartmentId(dept.id)}
                                        className={`p-3 text-sm font-semibold border rounded-lg cursor-pointer transition-all text-center ${selectedDepartmentId === dept.id
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200 ring-offset-1'
                                            : 'bg-white hover:border-emerald-500 text-emerald-900 border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        {dept.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Priority Queue Option */}
                    {activeDepartment ? (
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-3 pt-4 border-b">
                                <CardTitle className="text-sm uppercase tracking-wide text-slate-500">Queue Priority</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-2 gap-2">
                                {queueOptions.map(option => (
                                    <Button
                                        key={option}
                                        type="button"
                                        variant={selectedQueueOption === option ? "default" : "outline"}
                                        className={`text-xs font-bold ${selectedQueueOption === option
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        onClick={() => setSelectedQueueOption(option)}
                                    >
                                        {option}
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    <Button
                        disabled={!selectedDepartmentId || !selectedQueueOption || isPending}
                        onClick={handleAssign}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-lg shadow-lg"
                    >
                        {isPending ? "Assigning..." : "Assign & Release Ticket"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
