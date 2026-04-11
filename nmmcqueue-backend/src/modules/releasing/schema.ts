import { z } from 'zod';

// ─── Releasing Schemas ────────────────────────────────────────

export const assignTicketSchema = z.object({
    departmentId: z.string().min(1, 'departmentId is required'),
    priorityClass: z.string().min(1, 'priorityClass is required'),
});

export const assignTicketRequestSchema = z.object({
    body: assignTicketSchema,
    params: z.object({
        id: z.string().min(1, 'Visit ID is required'),
    }),
});

export const linkPatientRequestSchema = z.object({
    body: z.object({
        hospitalId: z.string().min(1, 'hospitalId is required'),
    }),
    params: z.object({
        id: z.string().min(1, 'Visit ID is required'),
    }),
});

export const visitParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Visit ID is required'),
    }),
});

export const callNextWindowRequestSchema = z.object({
    body: z.object({
        overrideClassification: z.enum(['PRIORITY', 'REGULAR']).optional(),
    }).optional().default({}),
});
