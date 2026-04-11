import type { UserRole } from './enums.js';

// ─── API Response Wrapper ────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    code?: string;
    errors?: unknown;
}

// ─── Session / Auth ──────────────────────────────────────────

export interface SessionUser {
    id: string;
    role: UserRole;
    isActive: boolean;
    firstName: string;
    lastName: string;
    middleName: string | null;
    suffix: string | null;
    email: string;
    employeeID: string;
    department: string | null;
    departmentId: string | null;
    workstationId: string | null;
    image: string | null;
    name: string;
    username: string | null;
    displayUsername: string | null;
}
