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
