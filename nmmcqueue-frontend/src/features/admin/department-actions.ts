"use server";
import * as callerApi from "@/features/caller/api";
import * as sharedApi from "@/features/shared/api";
import { getServerHeaders } from "@/lib/api/server";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
    return sharedApi.getDepartments({ headers: await getServerHeaders() });
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
