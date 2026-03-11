import { z } from "zod";

export const kioskFormSchema = z.object({
    hospitalId: z.string().optional(),
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
});

export type KioskFormValues = z.infer<typeof kioskFormSchema>;
