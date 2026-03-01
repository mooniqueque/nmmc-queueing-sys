"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/approve`, {
        method: "POST",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/admin-dashboard");
    return res.json();
}

export async function rejectUser(userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/reject`, {
        method: "POST",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/admin-dashboard");
    return res.json();
}

export async function adminCreateUser(data: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/users/create`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (res.ok) revalidatePath("/admin-dashboard");
    return res.json();
}

export async function updateUserRole(userId: string, newRole: string) {
    const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) revalidatePath("/admin-dashboard");
    return res.json();
}

export async function toggleUserStatus(userId: string, status: boolean) {
    const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ status })
    });
    if (res.ok) revalidatePath("/admin-dashboard");
    return res.json();
}

export async function getAllUsers() {
    const res = await fetch(`${API_URL}/users`, {
        headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Unable to retrieve user list.");
    const json = await res.json();
    return json.data;
}
