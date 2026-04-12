import { z } from 'zod';

// ─── Caller Schemas ───────────────────────────────────────────

export const createDepartmentRequestSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Department name is required'),
        code: z.string().min(1, 'Department code is required'),
    }),
});

export const updateDepartmentStatusRequestSchema = z.object({
    body: z.object({
        status: z.enum(['OPEN', 'CLOSED', 'FULL']),
    }),
    params: z.object({
        id: z.string().min(1, 'Department ID is required'),
    }),
});

export const createQueueOptionRequestSchema = z.object({
    body: z.object({
        departmentName: z.string().min(1, 'departmentName is required'),
        data: z.object({
            name: z.string().trim().min(1, 'Option name is required').max(60, 'Option name is too long'),
            code: z.string().trim().regex(/^[A-Za-z0-9-]{2,6}$/, 'Option code must be 2-6 chars (letters, numbers, hyphen only)'),
            isPriority: z.boolean(),
            parentId: z.string().optional(),
        }),
    }),
});

export const transferPatientRequestSchema = z.object({
    body: z.object({
        targetDepartmentId: z.string().min(1, 'targetDepartmentId is required'),
    }),
    params: z.object({
        visitId: z.string().min(1, 'Visit ID is required'),
    }),
});

export const callerVisitParamSchema = z.object({
    params: z.object({
        visitId: z.string().min(1, 'Visit ID is required'),
    }),
});

export const callNextPatientRequestSchema = z.object({
    body: z.object({
        overrideClassification: z.enum(['PRIORITY', 'REGULAR']).optional(),
    }).optional().default({}),
});

export const departmentIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Department ID is required'),
    }),
});

export const initializeDefaultQueueOptionsRequestSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Department ID is required'),
    }),
});

export const repairDefaultQueueOptionsRequestSchema = z.object({
    body: z.object({}).optional().default({}),
});
