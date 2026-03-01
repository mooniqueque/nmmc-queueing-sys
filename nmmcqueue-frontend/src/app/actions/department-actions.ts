"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function getDepartments() {
    const res = await fetch(`${API_URL}/clinic/departments`, {
        headers: await getAuthHeaders()
    });
    if (!res.ok) return { success: false, data: [] };
    const json = await res.json();
    return json;
}

export async function createDepartment(name: string, code: string) {
    const res = await fetch(`${API_URL}/clinic/departments`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ name, code })
    });
    if (res.ok) revalidatePath("/admin-departments");
    return res.json();
}

export async function deleteDepartment(id: string) {
    const res = await fetch(`${API_URL}/clinic/departments/${id}`, {
        method: "DELETE",
        headers: await getAuthHeaders()
    });
    if (res.ok) revalidatePath("/admin-departments");
    return res.json();
}
