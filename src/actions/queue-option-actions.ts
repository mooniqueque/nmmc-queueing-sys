"use server";

import { auth } from "@/lib/database/auth";
import { addQueueOption, removeQueueOption } from "@/services/queue-option-services";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function createQueueOption(departmentName: string, option: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "ADMIN") {
        return { success: false, error: "UNAUTHORIZED: Admin access required" };
    }

    const result = await addQueueOption(departmentName, option);

    if (result.success) {
        revalidatePath("/departments");
        revalidatePath("/caller");
    }

    return result;
}

export async function deleteQueueOption(departmentName: string, option: string) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || session.user.role !== "ADMIN") {
        return { success: false, error: "UNAUTHORIZED: Admin access required" };
    }

    const result = await removeQueueOption(departmentName, option);

    if (result.success) {
        revalidatePath("/departments");
        revalidatePath("/caller");
    }

    return result;
}
