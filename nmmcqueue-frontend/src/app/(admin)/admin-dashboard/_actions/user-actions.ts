"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(reqHeaders: Headers) {
    return {
        "Content-Type": "application/json",
        "cookie": reqHeaders.get("cookie") || ""
    };
}

export async function approveUser(userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/approve`, {
        method: "POST",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/dashboard");
    return res.json();
}

export async function rejectUser(userId: string) {
    const res = await fetch(`${API_URL}/users/${userId}/reject`, {
        method: "POST",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/dashboard");
    return res.json();
}

export async function adminCreateUser(data: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/users/create`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify(data)
    });
    if (res.ok) revalidatePath("/dashboard");
    return res.json();
}

export async function updateUserRole(userId: string, newRole: string) {
    const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PUT",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
        revalidatePath("/admin");
        revalidatePath("/dashboard");
    }
    return res.json();
}

export async function toggleUserStatus(userId: string, status: boolean) {
    const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PUT",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ status })
    });
    if (res.ok) {
        revalidatePath("/admin");
        revalidatePath("/dashboard");
    }
    return res.json();
}

export async function getAllUsers() {
    const res = await fetch(`${API_URL}/users`, {
        headers: getHeaders(await headers())
    });
    if (!res.ok) throw new Error("Unable to retrieve user list.");
    const json = await res.json();
    return json.data;
}
