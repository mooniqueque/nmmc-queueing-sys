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

export async function getDepartments() {
    const res = await fetch(`${API_URL}/clinic/departments`, {
        headers: getHeaders(await headers())
    });
    if (!res.ok) return { success: false, data: [] };
    const json = await res.json();
    return json;
}

export async function createDepartment(name: string, code: string) {
    const res = await fetch(`${API_URL}/clinic/departments`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ name, code })
    });
    if (res.ok) revalidatePath("/admin/departments");
    return res.json();
}

export async function deleteDepartment(id: string) {
    const res = await fetch(`${API_URL}/clinic/departments/${id}`, {
        method: "DELETE",
        headers: getHeaders(await headers())
    });
    if (res.ok) revalidatePath("/admin/departments");
    return res.json();
}
