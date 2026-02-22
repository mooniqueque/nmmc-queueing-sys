import { db } from "@/lib/database/prisma";


/**
 * SERVICE LAYER: Data Fetching (Read Operations)
 * This file is for fetching data from the database. 
 * These functions usually run on the server and are called by Server Components.
 */

//fetch all departments
export async function getDepartments() {
    try {
        const departments = await db.department.findMany({
            orderBy: { name: "asc" }
        });
        return { success: true, data: departments };
    } catch (error) {
        console.error("Failed to fetch departments:", error);
        return { success: false, error: "Failed to load departments" };
    }
}