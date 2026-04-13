import { z } from 'zod';

// ─── Workstation Schemas ──────────────────────────────────────

export const createWorkstationRequestSchema = z.object({
    body: z.object({
        type: z.enum(['WINDOW', 'TRIAGE', 'CALLER', 'KIOSK']),
        queueMode: z.enum(['MIXED', 'PRIORITY_ONLY', 'REGULAR_ONLY']).optional().default('MIXED'),
        customName: z.string().optional(),
        departmentId: z.string().optional(),
        count: z.coerce.number().int().min(1).max(20).optional().default(1),
    }),
});

export const updateWorkstationRequestSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        type: z.enum(['WINDOW', 'TRIAGE', 'CALLER', 'KIOSK']).optional(),
        isActive: z.boolean().optional(),
        queueMode: z.enum(['MIXED', 'PRIORITY_ONLY', 'REGULAR_ONLY']).optional(),
        departmentId: z.string().nullable().optional(),
        pairedStationId: z.string().nullable().optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'Workstation ID is required'),
    }),
});

export const workstationIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Workstation ID is required'),
    }),
});
