import { z } from "zod";

export const triageFormSchema = z.object({
    // Patient Demographics (Required for Walk-ins, ignored if from Kiosk)
    isManualEntry: z.boolean().default(false),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.union([z.date(), z.string()]).optional(),
    gender: z.string().optional(),

    // Vitals
    bloodPressure: z.string().optional(),
    heartRate: z.union([z.coerce.number(), z.string()]).optional().transform(val => val === "" ? undefined : Number(val)),
    respiratoryRate: z.union([z.coerce.number(), z.string()]).optional().transform(val => val === "" ? undefined : Number(val)),
    temperature: z.union([z.coerce.number(), z.string()]).optional().transform(val => val === "" ? undefined : Number(val)),
    oxygenSat: z.union([z.coerce.number(), z.string()]).optional().transform(val => val === "" ? undefined : Number(val)),

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
    disposition: z.enum(["EMERGENT", "URGENT", "NON-URGENT"]).default("NON-URGENT"),
    priorityClass: z.enum(["REGNEW", "REGOLD", "PRIO"]).default("REGNEW"),
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
        }
    });

export type TriageFormValues = z.infer<typeof triageFormSchema>;
