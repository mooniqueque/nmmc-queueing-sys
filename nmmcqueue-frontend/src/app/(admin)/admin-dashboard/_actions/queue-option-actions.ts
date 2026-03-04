"use server";
import * as callerApi from "@/lib/api/caller";
import { getServerHeaders } from "@/lib/api/index";
import { revalidatePath } from "next/cache";

export async function getQueueOptions(departmentName: string) {
    return callerApi.getQueueOptions(departmentName, {
        headers: await getServerHeaders(),
    });
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    return callerApi.getQueueOptionsByDepartment(departmentNames, {
        headers: await getServerHeaders(),
    });
}

export async function createQueueOption(departmentName: string, option: string) {
    const result = await callerApi.createQueueOption(departmentName, option, {
        headers: await getServerHeaders(),
    });
    if (result.success) {
        revalidatePath("/admin-departments");
        revalidatePath("/admin-caller");
    }
    return result;
}

export async function deleteQueueOption(departmentName: string, option: string) {
    const result = await callerApi.deleteQueueOption(departmentName, option, {
        headers: await getServerHeaders(),
    });
    if (result.success) {
        revalidatePath("/admin-departments");
        revalidatePath("/admin-caller");
    }
    return result;
}
