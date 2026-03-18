import { z } from "zod";

export const kioskFormSchema = z.object({
    hospitalId: z.string().optional(),
    contactNo: z.string().min(10, 'Contact number should be at least 10 digits').optional(),
    firstName: z.string().min(2, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(2, "Last name is required"),
    dobMonth: z.string().min(1, "Month is required"),
    dobDay: z.string().min(1, "Day is required"),
    dobYear: z.string().length(4, "Valid year is required"),
    age: z.coerce.number().optional(),
    gender: z.enum(["Male", "Female", "Prefer not to Say"], {
        message: "Please select a gender",
    }),
    address: z.string().min(5, "Complete address is required"),
    birthPlace: z.string().min(2, "Birthplace is required"),
    religion: z.string().min(2, "Religion is required"),
    civilStatus: z.enum(["Single", "Married", "Widowed", "Divorced", "Separated"], {
        message: "Please select a civil status",
    }),
    hasAppointment: z.boolean().default(false),
    categoryIds: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
    const monthNames: Record<string, number> = {
        "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
        "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
    };
    const mVal = monthNames[data.dobMonth] ?? (Number(data.dobMonth) - 1);
    const dob = new Date(Number(data.dobYear), mVal, Number(data.dobDay));
    
    if (dob > new Date()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date of Birth cannot be in the future", path: ["dobYear"] });
    }
    if (Number(data.dobYear) < 1900) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide a valid birth year (>= 1900)", path: ["dobYear"] });
    }
});

export type KioskFormValues = z.infer<typeof kioskFormSchema>;
