import { z } from 'zod';

// ─── Auth / User Management Schemas ───────────────────────────

export const adminCreateUserRequestSchema = z.object({
    body: z.object({
        email: z.string().email('Valid email is required'),
        name: z.string().min(1, 'Name is required'),
        employeeID: z.string().min(1, 'Employee ID is required'),
        role: z.enum(['ADMIN', 'TRIAGE_NURSE', 'WINDOW_CLERK', 'CLINIC_CALLER']),
        department: z.string().optional(),
        workstationId: z.string().optional(),
    }),
});

export const updateUserRoleRequestSchema = z.object({
    body: z.object({
        role: z.enum(['ADMIN', 'TRIAGE_NURSE', 'WINDOW_CLERK', 'CLINIC_CALLER']),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const toggleUserStatusRequestSchema = z.object({
    body: z.object({
        status: z.boolean(),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const updateUserDepartmentRequestSchema = z.object({
    body: z.object({
        department: z.string().optional(),
        departmentId: z.string().optional(),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const updateUserDepartmentAssignmentsRequestSchema = z.object({
    body: z.object({
        assignments: z.array(z.object({
            departmentId: z.string().min(1),
            isEnabled: z.boolean().optional().default(true),
        })).default([]),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const updateUserWorkstationRequestSchema = z.object({
    body: z.object({
        workstationId: z.string().nullable(),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const updateUserInfoRequestSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Valid email is required'),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const adminResetPasswordRequestSchema = z.object({
    body: z.object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
    }),
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});

export const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().min(1, 'User ID is required'),
    }),
});
