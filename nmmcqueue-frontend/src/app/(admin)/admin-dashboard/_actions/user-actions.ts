"use server";
import * as authApi from "@/lib/api/auth";
import { getServerHeaders } from "@/lib/api/index";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
    return authApi.getAllUsers({ headers: await getServerHeaders() });
}

export async function approveUser(userId: string) {
    const result = await authApi.approveUser(userId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}

export async function rejectUser(userId: string) {
    const result = await authApi.rejectUser(userId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}

export async function adminCreateUser(data: Record<string, unknown>) {
    const result = await authApi.adminCreateUser(data, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}

export async function updateUserRole(userId: string, newRole: string) {
    const result = await authApi.updateUserRole(userId, newRole, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}

export async function toggleUserStatus(userId: string, status: boolean) {
    const result = await authApi.toggleUserStatus(userId, status, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}
