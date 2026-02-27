"use server";

import { db } from "@/lib/database/prisma";

/**
 * Global Action: getDepartments
 * Fetches all departments. Used globally across Auth and Admin routes.
 */
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
