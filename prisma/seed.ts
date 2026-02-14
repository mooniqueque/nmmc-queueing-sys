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
            birthDate: new Date("1990-01-01").toISOString(),
            contactNumber: "09123456789",
            isApproved: true,
        }
    });

    console.log("✅ Admin user seeded successfully with password: adminpassword123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });