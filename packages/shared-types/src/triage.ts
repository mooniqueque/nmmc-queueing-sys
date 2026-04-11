import type { VisitClassification } from "./enums";

export interface KioskRegistrationPayload {
    hospitalId?: string;
    contactNo?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dobMonth: string;
    dobDay: string;
    dobYear: string;
    age?: number;
    gender: string;
    address: string;
    birthPlace: string;
    religion?: string;
    civilStatus: string;
    hasAppointment: boolean;
    originStationId?: string;
    categoryIds?: string[];
    kioskRegistrationType?: "REGISTERED" | "UNREGISTERED";
}

export interface TriageFormValues {
    isManualEntry: boolean;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    birthPlace?: string;
    religion?: string;
    civilStatus?: string;
    bloodPressure?: string;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSat?: number;
    hasFever: boolean;
    hasCough: boolean;
    hasColds: boolean;
    hasRashes: boolean;
    isInfectious: boolean;
    chiefComplaint?: string;
    medicalHistory?: string;
    triageRemarks?: string;
    disposition?: string;
    hasAppointment: boolean;
    departmentId?: string;
    categoryIds?: string[];
    priorityClass?: VisitClassification | string;
}

export interface TriageFormSubmissionPayload {
    visitId?: string;
    values: TriageFormValues;
}
