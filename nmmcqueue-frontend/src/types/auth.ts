export interface SessionUser {
    id: string;
    email: string;
    username: string;
    name: string;
    role: string;
    workstationId?: string;
    workstation?: {
        name: string;
        stationNo: number;
        pairedStationId?: string;
    };
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
    department: string;
    isApproved: boolean;
    isActive: boolean;
    createdAt: Date;
    employeeID: string;
    workstationId?: string;
    workstation?: {
        name: string;
        stationNo: number;
        pairedStationId?: string;
    };
}

export interface SignUpPayload {
    email: string;
    username: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    suffix?: string;
    employeeID: string;
    role: string;
    department: string;
    workstationId?: string;
    contactNumber: string;
    birthDate: string;
}

export interface AuthResponse {
    success: boolean;
    error?: string;
}
