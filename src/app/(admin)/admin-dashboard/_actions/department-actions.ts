"use server"

import { auth } from "@/lib/database/auth";
import { db } from "@/lib/database/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";


/**
 * ACTIONS LAYER: FOR Data Mutations (Write/Update/Delete Operations)
 * This file contains Server Actions that change data in the database
 */



//create new departments
export async function createDepartment(name: string, code: string) {
    //is user an admin?
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || session.user.role !== "ADMIN") {
        return { success: false, error: "UNAUTHORIZED: Admin access required" };

    }
    try {
        const newDept = await db.department.create({
            data: {
                name: name.trim().toUpperCase(),
                code: code.trim().toUpperCase()
            }
        });
        //to refresh the page after adding new department to show it in the UI
        revalidatePath("/admin/departments")
        return { success: true, data: newDept };

    } catch (error: unknown) {
        console.error("Failed to create department", error);
        if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { success: false, error: "A department with this name or code already exists." };

            }
        }
        return { success: false, error: "Database error occured." };
    }

}

// delete a department
export async function deleteDepartment(id: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "ADMIN") {
        return { success: false, error: "UNAUTHORIZED" };
    }
    try {
        await db.department.delete({
            where: { id: id }
        });

        revalidatePath("/admin/departments");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete department:", error);
        return { success: false, error: "Could not delete. It might be linked to active visits." };
    }
}
