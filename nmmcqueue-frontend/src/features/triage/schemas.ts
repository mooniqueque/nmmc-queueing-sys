import { z } from "zod";

const optionalBoundedNumber = (
    min: number,
    max: number,
    label: string
) => z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
        .number()
        .min(min, `${label} must be at least ${min}`)
        .max(max, `${label} must be at most ${max}`)
        .optional()
);

const optionalBloodPressure = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
        .string()
        .trim()
        .regex(/^\d{2,3}\/\d{2,3}$/, "Blood pressure must be in format SYSTOLIC/DIASTOLIC")
        .refine((value) => {
            const [systolic, diastolic] = value.split("/").map(Number);
            return (
                Number.isFinite(systolic) &&
                Number.isFinite(diastolic) &&
                systolic >= 70 &&
                systolic <= 250 &&
                diastolic >= 40 &&
                diastolic <= 150 &&
                systolic > diastolic
            );
        }, "Blood pressure values are out of expected range")
        .optional()
);

export const triageFormSchema = z.object({
    // Patient Demographics (Required for Walk-ins, ignored if from Kiosk)
    isManualEntry: z.boolean().default(false),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.union([z.date(), z.string()]).optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    birthPlace: z.string().optional(),
    religion: z.string().optional(),
    civilStatus: z.string().optional(),
    hasAppointment: z.boolean().default(false),

    // Vitals
    bloodPressure: optionalBloodPressure,
    heartRate: optionalBoundedNumber(20, 260, "Heart rate"),
    respiratoryRate: optionalBoundedNumber(5, 80, "Respiratory rate"),
    temperature: optionalBoundedNumber(30, 45, "Temperature"),
    oxygenSat: optionalBoundedNumber(50, 100, "Oxygen saturation"),

    // Symptoms
    hasFever: z.boolean().default(false),
    hasCough: z.boolean().default(false),
    hasColds: z.boolean().default(false),
    hasRashes: z.boolean().default(false),
    isInfectious: z.boolean().default(false),

    // Clinical
    chiefComplaint: z.string().min(5, "Chief complaint is required for triage"),
    medicalHistory: z.string().optional(),
    triageRemarks: z.string().optional(),
    disposition: z.enum(["EMERGENT", "URGENT", "NON-URGENT"], { message: "Acuity is required" }),
    priorityClass: z.string().default("REGNEW"),
    departmentId: z.string({ message: "Clinical department is required" }).min(1, "Clinical department is required"),
    categoryIds: z.array(z.string()).default([]),
})
    // SuperRefine to enforce Demographics validation ONLY if it is a manual entry!
    .superRefine((data, ctx) => {
        if (data.isManualEntry) {
            if (!data.firstName || data.firstName.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "First name is required for walk-ins", path: ["firstName"] });
            }
            if (!data.lastName || data.lastName.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Last name is required for walk-ins", path: ["lastName"] });
            }
            if (!data.dateOfBirth) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of Birth is required for walk-ins", path: ["dateOfBirth"] });
            }
            if (!data.gender || data.gender.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gender is required for walk-ins", path: ["gender"] });
            }
            if (!data.address || data.address.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required for walk-ins", path: ["address"] });
            }
            if (!data.birthPlace || data.birthPlace.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Birthplace is required for walk-ins", path: ["birthPlace"] });
            }
            if (!data.religion || data.religion.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Religion is required for walk-ins", path: ["religion"] });
            }
            if (!data.civilStatus || data.civilStatus.trim() === "") {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Civil status is required for walk-ins", path: ["civilStatus"] });
            }
            if (data.dateOfBirth) {
                const dob = new Date(data.dateOfBirth);
                if (dob > new Date()) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of Birth cannot be in the future", path: ["dateOfBirth"] });
                }
                if (dob.getFullYear() < 1900) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide a valid birth date (year >= 1900)", path: ["dateOfBirth"] });
                }
            }
        }
    });

export type TriageFormValues = z.infer<typeof triageFormSchema>;
