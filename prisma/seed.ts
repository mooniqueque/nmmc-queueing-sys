import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { auth } from "../src/lib/database/auth";


const url = process.env.DATABASE_URL;
if (!url) throw new Error("Database URL is not defined in the ENV!");
const adapter = new PrismaMariaDb(url);
const prisma = new PrismaClient({ adapter })
async function main() {
    console.log("🌱 Seeding database...");

    // 1. Delete existing admin to avoid "User already exists" error
    await prisma.user.deleteMany({
        where: { email: "admin@nmmc.gov.ph" }
    });

    // 2. Use BetterAuth Internal API to create the User AND the Password Account
    // This automatically hashes the password for you!
    interface AdminSeedBody {
        email: string;
        password: string;
        name: string;
        firstName: string;
        lastName: string;
        middleName: string;
        suffix: string;
        employeeID: string;
        role: string;
        department: string;
        birthDate: string;
        contactNumber: string;
        isApproved: boolean;
    }

    await auth.api.signUpEmail({
        body: {
            email: "admin@nmmc.gov.ph",
            password: "adminpassword123", // Set your password here
            name: "Makatti Kiffyko",
            firstName: "System",
            lastName: "Admin",
            middleName: "",
            suffix: "",
            employeeID: "admin123",
            role: "ADMIN",
            department: "Administration",
            birthDate: new Date("1990-01-01").toISOString(),
            contactNumber: "09123456789",
            isApproved: true,
        } as unknown as AdminSeedBody
    });

    console.log("✅ Admin user seeded successfully with password: adminpassword123");

    // 3. Seed 10 Mock Pending Users
    const mockUsers = [
        { name: "Andreanna Gorres", email: "andreanna@nmmc.gov.ph", dept: "Animal Bites", role: "CLINIC_CALLER" },
        { name: "Aljo Nicolo Andina", email: "aljo@nmmc.gov.ph", dept: "X-RAY", role: "WINDOW_CLERK" },
        { name: "Karl Valmores", email: "karl@nmmc.gov.ph", dept: "Surgery", role: "TRIAGE_NURSE" },
        { name: "Maria Clara", email: "maria@nmmc.gov.ph", dept: "Obstetrics & Gynecology", role: "CLINIC_CALLER" },
        { name: "Juan Dela Cruz", email: "juan@nmmc.gov.ph", dept: "Family Medicine", role: "WINDOW_CLERK" },
        { name: "Sisa Kapitan", email: "sisa@nmmc.gov.ph", dept: "Pediatrics", role: "TRIAGE_NURSE" },
        { name: "Basilio Santos", email: "basilio@nmmc.gov.ph", dept: "Internal Medicine", role: "CLINIC_CALLER" },
        { name: "Crispin Santos", email: "crispin@nmmc.gov.ph", dept: "Dental Service", role: "WINDOW_CLERK" },
        { name: "Elias Aguinaldo", email: "elias@nmmc.gov.ph", dept: "Pharmacy", role: "CLINIC_CALLER" },
        { name: "Ibarra Rizal", email: "ibarra@nmmc.gov.ph", dept: "Laboratory", role: "WINDOW_CLERK" },
    ];

    console.log("🌱 Seeding mock pending users...");
    for (const [index, user] of mockUsers.entries()) {
        await auth.api.signUpEmail({
            body: {
                email: user.email,
                password: "password123",
                name: user.name,
                firstName: user.name.split(' ')[0],
                lastName: user.name.split(' ').slice(1).join(' '),
                middleName: "",
                suffix: "",
                employeeID: `mock-${1000 + index}`,
                role: user.role,
                department: user.dept,
                birthDate: new Date("1995-05-15").toISOString(),
                contactNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
                isApproved: false, // All pending
            } as unknown as AdminSeedBody
        });
    }
    console.log("✅ 10 Mock pending users seeded.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });