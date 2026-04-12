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
            name: z.string().min(1, 'Option name is required'),
            code: z.string().min(1, 'Option code is required'),
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
