import { z } from "zod";

export const kioskFormSchema = z.object({
    hospitalId: z.string().optional(),
    firstName: z.string().min(2, "First name kay atleast dapat naay 2 ka letra"),
    lastName: z.string().min(2, "Last name kay atleast dapat naay 2 ka letra "),
    dateOfBirth: z.string().refine((date) => {
        return new Date(date) <= new Date();
    }, "Paghatag ug Sakto nga Petsa sa Birthday"),
    gender: z.enum(["Male", "Female"], {
        message: "Pagpili ug imong saktong kasarian.",
    }),
})

export type KioskFormValues = z.infer<typeof kioskFormSchema>;