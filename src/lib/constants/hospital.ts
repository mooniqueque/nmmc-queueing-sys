/**
 * HOSPITAL CONSTANTS
 * Shared across registration, admin dashboard, and user management.
 */

export const HOSPITAL_DEPARTMENTS = [
    "Administration",
    "Animal Bites",
    "Family Medicine",
    "Dental Service",
    "Pediatrics",
    "Internal Medicine",
    "Surgery",
    "Obstetrics & Gynecology",
    "X-RAY",
    "Laboratory",
    "Pharmacy"
] as const;

export const HOSPITAL_ROLES = [
    { value: "TRIAGE_NURSE", label: "Triage Nurse" },
    { value: "WINDOW_CLERK", label: "Window Clerk" },
    { value: "CLINIC_CALLER", label: "Clinic Caller" },
    { value: "ADMIN", label: "Admin" }
] as const;
