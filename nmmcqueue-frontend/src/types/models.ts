export interface Department {
    id: string;
    name: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string;
    isActive: boolean;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Patient {
    id: string;
    hospitalId: string | null;
    firstName: string;
    lastName: string;
    middleName: string | null;
    dateOfBirth: Date | string;
    age: number;
    gender: string;
    address?: string;
    birthPlace?: string;
    religion?: string;
    civilStatus?: string;
}

export interface Visit {
    id: string;
    patientId: string;
    departmentId?: string;
    status: string;
    ticketNumber: number;
    hasAppointment: boolean;
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
    queueDate?: Date | string;
    createdAt: Date;
    updatedAt: Date;
}
