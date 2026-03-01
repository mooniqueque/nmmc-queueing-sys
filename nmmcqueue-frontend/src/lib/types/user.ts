/**
 * SHARED TYPES: User & Session
 * These are used across the entire application (Services, Actions, and UI).
 */

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    isApproved: boolean;
    isActive: boolean;
    createdAt: Date;
    employeeID: string;
}
