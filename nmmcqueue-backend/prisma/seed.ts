import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { auth } from "../src/modules/auth/auth"; // Relative import to local auth instance

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("Database URL is not defined in the ENV!");

const parsed = new URL(rawUrl);
const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 3306,
    user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, '') || undefined,
});
const prisma = new PrismaClient({ adapter } as any);
async function main() {
    console.log("🌱 Seeding database...");

    try {
        // 1. Clear existing data
        console.log("🗑️  Clearing existing data...");
        // Delete efficiently
        await prisma.session.deleteMany();
        await prisma.account.deleteMany();
        await prisma.verification.deleteMany();
        await prisma.user.deleteMany();
        await prisma.workStation.deleteMany();
        // DO NOT delete departments entirely as there might be legitimate user-made ones, 
        // but we will ensure our seeded ones exist.

        console.log("✅ Users data cleared");

        // DEFINITIONS
        const callers = [
            { name: "Andreanna Gorres", email: "andreanna@nmmc.gov.ph", dept: "Animal Bite Department", empId: "EMP002" },
            { name: "Maria Clara", email: "maria@nmmc.gov.ph", dept: "Family Medicine", empId: "EMP005" },
            { name: "Basilio Santos", email: "basilio@nmmc.gov.ph", dept: "Internal Medicine", empId: "EMP007" },
            { name: "Elias Aguinaldo", email: "elias@nmmc.gov.ph", dept: "Pediatrics", empId: "EMP009" },
            { name: "Rosa Santos", email: "rosa@nmmc.gov.ph", dept: "Obstetrics & Gynecology", empId: "EMP015" },
        ];

        const clerks = [
            { name: "Aljo Nicolo Andina", email: "aljo@nmmc.gov.ph", dept: "X-RAY Department", empId: "EMP003" },
            { name: "Juan Dela Cruz", email: "juan@nmmc.gov.ph", dept: "Family Medicine", empId: "EMP006" },
            { name: "Crispin Santos", email: "crispin@nmmc.gov.ph", dept: "Dental Clinic", empId: "EMP008" },
            { name: "Ibarra Rizal", email: "ibarra@nmmc.gov.ph", dept: "Laboratory", empId: "EMP010" },
            { name: "Lorenzo Santos", email: "lorenzo@nmmc.gov.ph", dept: "Pharmacy", empId: "EMP016" },
        ];

        const additionalUsers = [
            { name: "Karl Valmores", email: "karl@nmmc.gov.ph", dept: "Surgery", role: "TRIAGE_NURSE", empId: "EMP004" },
            { name: "Sisa Kapitan", email: "sisa@nmmc.gov.ph", dept: "Pediatrics", role: "TRIAGE_NURSE", empId: "EMP011" },
            { name: "Cecilio Santos", email: "cecilio@nmmc.gov.ph", dept: "Cardiology", role: "CLINIC_CALLER", empId: "EMP012" },
            { name: "Placido Marquez", email: "placido@nmmc.gov.ph", dept: "Nephrology", role: "WINDOW_CLERK", empId: "EMP013" },
            { name: "Herminia Ortiz", email: "herminia@nmmc.gov.ph", dept: "ENT", role: "TRIAGE_NURSE", empId: "EMP014" },
            { name: "Silverio Santos", email: "silverio@nmmc.gov.ph", dept: "Ophthalmology", role: "CLINIC_CALLER", empId: "EMP017" },
        ];

        // 1.5 Seed Departments
        console.log("🏥 Synchronizing Departments...");
        const allDepts = Array.from(new Set([
            "Administration",
            ...callers.map(c => c.dept),
            ...clerks.map(c => c.dept),
            ...additionalUsers.map(u => u.dept)
        ]));

        const deptMap: Record<string, string> = {};
        for (const deptString of allDepts) {
            const name = deptString.trim().toUpperCase();
            // Generate a simple code if one doesn't exist, e.g. INTERNAL MEDICINE -> INT
            const code = name.replace(/[^A-Z]/g, '').substring(0, 4) || name.substring(0, 4);
            
            // Generate slug from name: "Internal Medicine" -> "internal-medicine"
            const slug = deptString.toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const dept = await prisma.department.upsert({
                where: { name },
                update: { slug, code },
                create: { name, slug, code }
            });
            deptMap[deptString] = dept.id;
        }
        console.log(`✅ ${allDepts.length} departments synchronized`);

        // 1.6 Seed Workstations
        console.log("🏁 Synchronizing Workstations...");
        const workstationSeeds = [
            { name: "Entrance Triage 1", type: "TRIAGE", stationNo: 1 },
            { name: "Main Window 1", type: "WINDOW", stationNo: 1 },
            { name: "Main Window 2", type: "WINDOW", stationNo: 2 },
            { name: "Main Window 3", type: "WINDOW", stationNo: 3 },
            { name: "Clinic Desk Alpha", type: "CALLER", stationNo: 1 },
            { name: "Clinic Desk Beta", type: "CALLER", stationNo: 2 },
        ];

        const wsMap: Record<string, string> = {};
        for (const ws of workstationSeeds) {
            const created = await prisma.workStation.upsert({
                where: { name: ws.name },
                update: {},
                create: { 
                    name: ws.name, 
                    type: ws.type as any, 
                    stationNo: ws.stationNo 
                }
            });
            wsMap[ws.name] = created.id;
        }
        console.log(`✅ ${workstationSeeds.length} workstations synchronized`);

        console.log("✅ Database cleared");

        // 2. Seed Admin User
        console.log("👤 Creating admin user...");
        await auth.api.signUpEmail({
            body: {
                email: "admin@nmmc.gov.ph",
                password: "password123",
                name: "Makatti Kiffyko",
                firstName: "Makatti",
                lastName: "Kiffyko",
                middleName: "",
                suffix: "",
                birthDate: new Date("1985-03-15").toISOString(),
                contactNumber: "09171234567",
                employeeID: "EMP001",
                username: "admin",
                role: "ADMIN" as any,
                departmentId: deptMap["Administration"],
                department: "Administration",
                workstationId: wsMap["Main Window 1"] as any, // Admin doesn't strictly need one but schema/auth might expect it
            },
            headers: new Headers(),
        });
        console.log("✅ Admin user created");

        // 3. Seed Approved Clinic Callers
        console.log("📞 Creating clinic callers...");

        for (const caller of callers) {
            await auth.api.signUpEmail({
                body: {
                    email: caller.email,
                    password: "password123",
                    name: caller.name,
                    firstName: caller.name.split(' ')[0],
                    lastName: caller.name.split(' ').slice(1).join(' '),
                    middleName: "",
                    suffix: "",
                    birthDate: new Date("1990-06-20").toISOString(),
                    contactNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
                    employeeID: caller.empId,
                    username: caller.email.split('@')[0],
                    role: "CLINIC_CALLER" as any,
                    departmentId: deptMap[caller.dept],
                    department: caller.dept,
                    workstationId: wsMap["Clinic Desk Alpha"],
                },
                headers: new Headers(),
            });
        }
        console.log(`✅ ${callers.length} clinic callers created`);

        // 4. Seed Approved Window Clerks
        console.log("🪟 Creating window clerks...");

        for (const clerk of clerks) {
            await auth.api.signUpEmail({
                body: {
                    email: clerk.email,
                    password: "password123",
                    name: clerk.name,
                    firstName: clerk.name.split(' ')[0],
                    lastName: clerk.name.split(' ').slice(1).join(' '),
                    middleName: "",
                    suffix: "",
                    birthDate: new Date("1992-08-10").toISOString(),
                    contactNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
                    employeeID: clerk.empId,
                    username: clerk.email.split('@')[0],
                    role: "WINDOW_CLERK" as any,
                    departmentId: deptMap[clerk.dept],
                    department: clerk.dept,
                    workstationId: wsMap["Main Window 1"],
                },
                headers: new Headers(),
            });
        }
        console.log(`✅ ${clerks.length} window clerks created`);

        // 5. Seed additional staff users
        console.log("👥 Creating additional users...");

        for (const additionalUser of additionalUsers) {
            await auth.api.signUpEmail({
                body: {
                    email: additionalUser.email,
                    password: "password123",
                    name: additionalUser.name,
                    firstName: additionalUser.name.split(' ')[0],
                    lastName: additionalUser.name.split(' ').slice(1).join(' '),
                    middleName: "",
                    suffix: "",
                    birthDate: new Date("1995-05-15").toISOString(),
                    contactNumber: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
                    employeeID: additionalUser.empId,
                    username: additionalUser.email.split('@')[0],
                    role: additionalUser.role as any,
                    departmentId: deptMap[additionalUser.dept],
                    department: additionalUser.dept,
                    workstationId: (additionalUser.role === 'TRIAGE_NURSE' ? wsMap["Entrance Triage 1"] : wsMap["Main Window 1"]) as any,
                },
                headers: new Headers(),
            });
        }
        console.log(`✅ ${additionalUsers.length} additional users created`);

        // 6. Display summary
        const totalUsers = await prisma.user.count();
        const accountCount = await prisma.account.count();

        console.log("\n📊 Database Seeding Summary:");
        console.log(`   Total Users: ${totalUsers}`);
        console.log(`   Total Accounts (Logins): ${accountCount}`);
        console.log("\n🎯 Seeding completed successfully!");

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("❌ Seeding failed:", errorMessage);
        process.exit(1);

    } finally {
        await prisma.$disconnect();
    }
}
main().catch((error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error during seeding:", errorMessage);
    process.exit(1);
});