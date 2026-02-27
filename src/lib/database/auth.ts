import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";

//connection from betterauth to db
export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "mysql",
    }),
    advanced: {
        defaultCookieAttributes: {
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
        },
    },
    //signin and signup validator
    emailAndPassword: {
        enabled: true
    },
    //mapping the custom fields so betterauth can read it
    user: {
        additionalFields: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            middleName: { type: "string" },
            suffix: { type: "string" },
            employeeID: { type: "string" },
            department: { type: "string" },
            role: { type: "string" },
            birthDate: { type: "string" },
            contactNumber: { type: "string" },
            isApproved: { type: "boolean" },
        }
    },
    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    // Instead of a separate Prisma query (which may cause connection pooling delays on login),
                    // we'll rely on the existing user data from BetterAuth if possible, or just the lightweight approach.
                    const user = await db.user.findUnique({
                        where: { id: session.userId },
                        select: { isApproved: true } // only select what we need
                    });
                    if (user && !user.isApproved) {
                        throw new Error("Account pending administrative approval.");
                    }
                    return { data: session };
                }
            }
        }
    }
});