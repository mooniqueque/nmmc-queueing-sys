import { z } from 'zod';

const optionalBoundedNumber = (
    min: number,
    max: number,
    label: string
) => z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.coerce
        .number()
        .min(min, `${label} must be at least ${min}`)
        .max(max, `${label} must be at most ${max}`)
        .optional()
);

const optionalBloodPressure = z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z
        .string()
        .trim()
        .regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format SYSTOLIC/DIASTOLIC (e.g., 120/80)')
        .refine((value) => {
            const [systolic, diastolic] = value.split('/').map(Number);
            return (
                Number.isFinite(systolic) &&
                Number.isFinite(diastolic) &&
                systolic >= 70 &&
                systolic <= 250 &&
                diastolic >= 40 &&
                diastolic <= 150 &&
                systolic > diastolic
            );
        }, 'Blood pressure values are out of expected range')
        .optional()
);

export const kioskFormRequestSchema = z.object({
    body: z.object({
        hospitalId: z.string().optional(),
        contactNo: z.string().min(10, 'Contact number should be at least 10 digits').optional(),
        firstName: z.string().min(1, 'First name is required'),
        middleName: z.string().optional(),
        lastName: z.string().min(1, 'Last name is required'),
        dobMonth: z.string().min(1, 'Month is required'),
        dobDay: z.string().min(1, 'Day is required'),
        dobYear: z.string().min(4, 'Year is required'),
        age: z.coerce.number().optional(),
        gender: z.string().min(1, 'Gender is required'),
        address: z.string().min(1, 'Address is required'),
        birthPlace: z.string().min(1, 'Birth place is required'),
        religion: z.string().optional(),
        civilStatus: z.string().min(1, 'Civil status is required'),
        hasAppointment: z.boolean().default(false),
        originStationId: z.string().optional(),
        categoryIds: z.array(z.string()).optional(),
        kioskRegistrationType: z.enum(['REGISTERED', 'UNREGISTERED']).optional(),
    }),
});

export const triageFormRequestSchema = z.object({
    body: z.object({
        visitId: z.string().optional(),
        values: z.object({
            isManualEntry: z.boolean().default(false),
            firstName: z.string().optional(),
            middleName: z.string().optional(),
            lastName: z.string().optional(),
            dateOfBirth: z.string().optional(),
            gender: z.string().optional(),
            address: z.string().optional(),
            birthPlace: z.string().optional(),
            religion: z.string().optional(),
            civilStatus: z.string().optional(),
            bloodPressure: optionalBloodPressure,
            heartRate: optionalBoundedNumber(20, 260, 'Heart rate'),
            respiratoryRate: optionalBoundedNumber(5, 80, 'Respiratory rate'),
            temperature: optionalBoundedNumber(30, 45, 'Temperature'),
            oxygenSat: optionalBoundedNumber(50, 100, 'Oxygen saturation'),
            hasFever: z.boolean().default(false),
            hasCough: z.boolean().default(false),
            hasColds: z.boolean().default(false),
            hasRashes: z.boolean().default(false),
            isInfectious: z.boolean().default(false),
            chiefComplaint: z.string().optional(),
            medicalHistory: z.string().optional(),
            triageRemarks: z.string().optional(),
            disposition: z.string().optional(),
            hasAppointment: z.boolean().default(false),
            departmentId: z.string().optional(),
            categoryIds: z.array(z.string()).optional(),
            priorityClass: z.string().optional(),
        }),
    }),
});

export const kioskFormSchema = kioskFormRequestSchema.shape.body;
export const triageFormSchema = triageFormRequestSchema.shape.body.shape.values;
