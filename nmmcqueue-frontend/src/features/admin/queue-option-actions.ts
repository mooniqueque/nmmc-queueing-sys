"use server";
import * as callerApi from "@/features/caller/api";
import * as sharedApi from "@/features/shared/api";
import { getServerHeaders } from "@/lib/api/server";
import { revalidatePath } from "next/cache";

export async function getQueueOptions(departmentName: string) {
    return sharedApi.getQueueOptions(departmentName, {
        headers: await getServerHeaders(),
    });
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    return sharedApi.getQueueOptionsByDepartment(departmentNames, {
        headers: await getServerHeaders(),
    });
}

export async function createQueueOption(
    departmentName: string,
    data: { name: string; code: string; isPriority: boolean; parentId?: string }
) {
    try {
        const result = await callerApi.createQueueOption(departmentName, data, {
            headers: await getServerHeaders(),
        });
        if (result.success) {
            revalidatePath("/admin-departments");
            revalidatePath("/admin-caller");
        }
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add queue option.";
        return { success: false, error: message };
    }
}

export async function deleteQueueOption(id: string) {
    try {
        const result = await callerApi.deleteQueueOption(id, {
            headers: await getServerHeaders(),
        });
        if (result.success) {
            revalidatePath("/admin-departments");
            revalidatePath("/admin-caller");
        }
        return result;
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to delete queue option.";
        return { success: false, error: message };
    }
}

export async function initializeDepartmentQueueDefaults(departmentId: string) {
    return callerApi.initializeDepartmentQueueDefaults(departmentId, {
        headers: await getServerHeaders(),
    });
}

export async function repairDefaultQueueOptions() {
    return callerApi.repairDefaultQueueOptions({
        headers: await getServerHeaders(),
    });
}
