import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import { db } from '../../config/database.js';

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: 'mysql',
    }),
    trustedOrigins: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
    ],
    advanced: {
        defaultCookieAttributes: {
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        username(),
    ],
    user: {
        additionalFields: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            middleName: { type: 'string' },
            suffix: { type: 'string' },
            employeeID: { type: 'string' },
            department: { type: 'string' },
            departmentId: { type: 'string' },
            workstationId: { type: 'string' },
            role: { type: 'string' },
            birthDate: { type: 'string' },
            contactNumber: { type: 'string' },
            isApproved: { type: 'boolean' },
        },
    },
});
