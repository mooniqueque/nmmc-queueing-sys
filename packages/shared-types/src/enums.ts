// ─── Core Enums ──────────────────────────────────────────────
// Mirrors Prisma schema enums for use across frontend and backend
// without requiring a Prisma dependency.

export const UserRole = {
    ADMIN: 'ADMIN',
    TRIAGE_NURSE: 'TRIAGE_NURSE',
    WINDOW_CLERK: 'WINDOW_CLERK',
    CLINIC_CALLER: 'CLINIC_CALLER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const VisitStatus = {
    WAITING_TRIAGE: 'WAITING_TRIAGE',
    IN_TRIAGE: 'IN_TRIAGE',
    WAITING_WINDOW: 'WAITING_WINDOW',
    IN_WINDOW: 'IN_WINDOW',
    WAITING_CLINIC: 'WAITING_CLINIC',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    NO_SHOW: 'NO_SHOW',
} as const;
export type VisitStatus = (typeof VisitStatus)[keyof typeof VisitStatus];

export const VisitClassification = {
    REGULAR: 'REGULAR',
    PRIORITY: 'PRIORITY',
} as const;
export type VisitClassification = (typeof VisitClassification)[keyof typeof VisitClassification];

export const WorkstationType = {
    WINDOW: 'WINDOW',
    TRIAGE: 'TRIAGE',
    CALLER: 'CALLER',
} as const;
export type WorkstationType = (typeof WorkstationType)[keyof typeof WorkstationType];
