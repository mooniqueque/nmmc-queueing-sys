import type { DepartmentStatus as SharedDepartmentStatus } from "@nmmc/types";

export enum UserRole {
    ADMIN = "ADMIN",
    TRIAGE_NURSE = "TRIAGE_NURSE",
    WINDOW_CLERK = "WINDOW_CLERK",
    CLINIC_CALLER = "CLINIC_CALLER"
}

export enum VisitStatus {
    WAITING_TRIAGE = "WAITING_TRIAGE",
    IN_TRIAGE = "IN_TRIAGE",
    WAITING_WINDOW = "WAITING_WINDOW",
    IN_WINDOW = "IN_WINDOW",
    WAITING_CLINIC = "WAITING_CLINIC",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    NO_SHOW = "NO_SHOW"
}

export enum VisitClassification {
    REGULAR = "REGULAR",
    PRIORITY = "PRIORITY"
}

export interface PriorityCategory {
    id: string;
    name: string;
    code: string;
    isPriority: boolean;
    templateId?: string;
    template?: {
        sortOrder: number;
    };
    departmentId?: string;
    parentId?: string;
    children?: PriorityCategory[];
}

export interface VisitPriorityCategory {
    visitId: string;
    categoryId: string;
    category: PriorityCategory;
}

export enum WorkstationType {
    WINDOW = "WINDOW",
    TRIAGE = "TRIAGE",
    CALLER = "CALLER"
}

export enum WorkstationQueueMode {
    MIXED = "MIXED",
    PRIORITY_ONLY = "PRIORITY_ONLY",
    REGULAR_ONLY = "REGULAR_ONLY",
}

export const DepartmentStatus = {
    OPEN: "OPEN",
    CLOSED: "CLOSED",
    FULL: "FULL",
} as const satisfies Record<SharedDepartmentStatus, SharedDepartmentStatus>;
export type DepartmentStatus = SharedDepartmentStatus;

export interface WorkStation {
    id: string;
    name: string;
    type: WorkstationType;
    queueMode?: WorkstationQueueMode;
    stationNo: number;
    isActive: boolean;
    departmentId?: string;
    department?: Department;
    parentWorkstationId?: string | null;
    parentWorkstation?: {
        id: string;
        name: string;
        stationNo: number;
        type: WorkstationType;
    } | null;
    childWorkstations?: WorkStation[];
    pairedStationId?: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    status?: DepartmentStatus;
    videoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    department?: string;
    departmentId?: string;
    workstationId?: string;
    workstation?: WorkStation;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Patient {
    id: string;
    hospitalId: string | null;
    firstName: string;
    lastName: string;
    middleName: string | null;
    contactNo?: string | null;
    dateOfBirth: Date | string;
    gender: string;
    address?: string;
    birthPlace?: string;
    religion?: string;
    civilStatus?: string;
    // Note: age is computed on frontend from dateOfBirth
}

export interface Visit {
    id: string;
    patientId: string;
    departmentId?: string;
    status: VisitStatus;
    classification: VisitClassification;
    categories: VisitPriorityCategory[];
    ticketNumber?: number | null;
    triageTicket?: number | null;
    serviceTicket?: number | null;
    sequenceKey?: string | null;
    queueBusinessDay?: string;
    kioskRegistrationType?: 'REGISTERED' | 'UNREGISTERED' | null;
    hasAppointment: boolean;
    isReferred: boolean;
    referredFromId?: string;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSat?: number;
    hasFever?: boolean;
    hasCough?: boolean;
    hasColds?: boolean;
    hasRashes?: boolean;
    isInfectious?: boolean;
    chiefComplaint?: string;
    medicalHistory?: string;
    triageRemarks?: string;
    disposition?: string;
    triagedAt?: Date | string;
    triagedByUserId?: string;
    calledAt?: Date | string;
    calledByUserId?: string;
    windowNumber?: number;
    triageClaimedById?: string;
    windowClaimedById?: string;
    triageStartedAt?: Date | string;
    windowStartedAt?: Date | string;
    queueDate?: Date | string;
    createdAt: Date;
    updatedAt: Date;
    patient: Patient;
    originStationId?: string;
    triageStationId?: string;
    originStation?: WorkStation;
    triageStation?: WorkStation;
}
