import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(8, { message: "Password is required" }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const registrationSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    employeeID: z.string().trim().regex(/^[0-9]+$/, "Valid Employee ID is required"),
    birthDate: z.string().min(1, "Birth date is required"),
    contactNumber: z.string().min(11, "Valid contact number is required"),
    role: z.string().min(1, "Role is required"),
    department: z.string().min(2, "Department is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
