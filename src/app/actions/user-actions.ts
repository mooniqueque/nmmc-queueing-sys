"use strict";
"use server";

import { auth } from "@/lib/database/auth";
import { db } from "@/lib/database/prisma";
import { revalidatePath } from "next/cache";

/**
 * ACTIONS LAYER: Data Mutations (Write/Update/Delete Operations)
 * This file contains Server Actions that change data in the database.
 * These are called 'Command' functions because they instruct the system to do something.
 */

// --- USER MANAGEMENT ACTIONS ---

/**
 * Approves a pending staff member.
 * @param userId - The unique ID of the user to approve.
 */
export async function approveUser(userId: string) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { isApproved: true },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve user:", error);
        return { success: false, error: "Failed to approve user" };
    }
}

/**
 * Rejects and removes a pending user request.
 * @param userId - The unique ID of the user to delete.
 */
export async function rejectUser(userId: string) {
    try {
        // In a real scenario, you might want to mark as inactive or delete
        // For now, let's delete the user to keep the pending list clean
        await db.user.delete({
            where: { id: userId },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to reject user:", error);
        return { success: false, error: "Failed to reject user" };
    }
}

/**
 * Allows an admin to manually create and auto-approve a new staff member.
 * @param data - The staff registration details.
 */
export async function adminCreateUser(data: {
    email: string;
    name: string;
    employeeID: string;
    role: string;
    department: string;
}) {
    interface AdminCreateBody {
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

    try {
        await auth.api.signUpEmail({
            body: {
                email: data.email,
                password: "password123", // should be in env when final
                name: data.name,
                firstName: data.name.split(' ')[0],
                lastName: data.name.split(' ').slice(1).join(' '),
                middleName: "",
                suffix: "",
                employeeID: data.employeeID,
                role: data.role,
                department: data.department,
                birthDate: new Date().toISOString(),
                contactNumber: "09000000000",
                isApproved: true,
            } as unknown as AdminCreateBody
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Failed to create user. It might already exist." };
    }
}

/**
 * Updates a user's role in the database.
 * @param userId - The ID of the user to update.
 * @param newRole - The new role string (e.g., 'ADMIN', 'CLINIC_CALLER').
 */
export async function updateUserRole(userId: string, newRole: string) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { role: newRole },
        });

        // Revalidate relevant paths to update UI
        revalidatePath("/admin");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ [Action] Failed to update user role:", error);
        return { success: false, error: "Unable to update role. Please try again." };
    }
}

/**
 * Toggles a user's active status (Active/Inactive).
 * @param userId - The ID of the user to update.
 * @param status - The new active status.
 */
export async function toggleUserStatus(userId: string, status: boolean) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { isActive: status },
        });

        revalidatePath("/admin");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ [Action] Failed to update user status:", error);
        return { success: false, error: "Unable to update status. Please try again." };
    }
}
