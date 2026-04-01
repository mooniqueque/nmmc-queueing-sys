/**
 * HOSPITAL CONSTANTS
 * Shared across registration, admin dashboard, and user management.
 */

export const HOSPITAL_ROLES = [
    { value: "TRIAGE_NURSE", label: "Triage Nurse" },
    { value: "WINDOW_CLERK", label: "Window Clerk" },
    { value: "CLINIC_CALLER", label: "Clinic Caller" },
    { value: "ADMIN", label: "Admin" }
] as const;

export type HospitalRole = (typeof HOSPITAL_ROLES)[number]["value"];
