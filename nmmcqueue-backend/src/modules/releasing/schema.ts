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

export const updatePatientDemographicsRequestSchema = z.object({
    body: z.object({
        firstName: z.string().min(1, 'firstName is required'),
        middleName: z.string().optional(),
        lastName: z.string().min(1, 'lastName is required'),
        address: z.string().optional(),
        dateOfBirth: z.string().min(1, 'dateOfBirth is required'),
        gender: z.string().min(1, 'gender is required'),
        contactNo: z.string().optional(),
        civilStatus: z.string().optional(),
        birthPlace: z.string().optional(),
        religion: z.string().optional(),
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

export const callPriorityClassRequestSchema = z.object({
    body: z.object({
        priorityTemplateId: z.string().min(1, 'priorityTemplateId is required').optional(),
        priorityCategoryKey: z.string().min(1, 'priorityCategoryKey is required').optional(),
    }).refine((data) => Boolean(data.priorityTemplateId || data.priorityCategoryKey), {
        message: 'priorityTemplateId is required',
        path: ['priorityTemplateId'],
    }),
});
