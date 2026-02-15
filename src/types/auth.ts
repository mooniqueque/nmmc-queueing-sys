/**
 * AUTH TYPES
 * Strictly defined types for authentication payloads and responses.
 */

export interface SignUpPayload {
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    employeeID: string;
    role: string;
    department: string;
    contactNumber: string;
    birthDate: string;
}

export interface AuthResponse {
    success: boolean;
    error?: string;
}
