import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "mysql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    //mapping the custom fields so betterauth can read it
    user: {
        additionalFields: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            middleName: { type: "string" },
            suffix: { type: "string" },
            employeeID: { type: "string" },
            role: { type: "string" },
            birthDate: { type: "string" },
            contactNumber: { type: "string" },
            isApproved: { type: "boolean" },
        }
    }
});