import { z } from "zod";

//defining the rules schema for registration

export const registrationSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    employeeID: z.string().trim().regex(/^[0-9]+$/, "ID must be numbers only and No extra spaces"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});





