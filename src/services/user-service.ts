"use server";

import { db } from "@/lib/database/prisma";
import { UserData } from "@/types/user";

/**
 * SERVICE LAYER: Data Fetching (Read Operations)
 * This file is for fetching data from the database. 
 * These functions usually run on the server and are called by Server Components.
 */

/**
 * Fetches all registered users from the database.
 * @returns Array of user objects ordered by most recent registration.
 */
export async function getAllUsers(): Promise<UserData[]> {
    try {
        console.log("🔍 [Service] Fetching all users from database...");
        return await db.user.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        }) as UserData[];
    } catch (error) {
        console.error("❌ [Service] Failed to fetch users:", error);
        throw new Error("Unable to retrieve user list.");
    }
}

/**
 * Additional Fetching logic could go here, for example:
 * - getApprovedUsers()
 * - getUserByEmployeeID(id: string)
 */
