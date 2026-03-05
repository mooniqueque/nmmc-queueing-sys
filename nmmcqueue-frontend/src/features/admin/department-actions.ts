"use server";
import * as callerApi from "@/features/caller/api";
import { getServerHeaders } from "@/lib/api/index";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
    return callerApi.getDepartments({ headers: await getServerHeaders() });
}

export async function createDepartment(name: string, code: string) {
    const result = await callerApi.createDepartment(name, code, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-departments");
    return result;
}

export async function deleteDepartment(id: string) {
    const result = await callerApi.deleteDepartment(id, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-departments");
    return result;
}
