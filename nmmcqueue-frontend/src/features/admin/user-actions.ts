"use server";
import * as authApi from "@/features/auth/api";
import { getServerHeaders } from "@/lib/api/server";
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

export async function updateUserDepartment(userId: string, department: string) {
    const result = await authApi.updateUserDepartment(userId, department, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}

export async function updateUserWorkstation(userId: string, workstationId: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"}/api/users/${userId}/workstation`, {
        method: "PUT",
        headers: {
            ...(await getServerHeaders()),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ workstationId }),
    });
    const result = await response.json();
    if (result.success) revalidatePath("/admin-dashboard");
    return result;
}
