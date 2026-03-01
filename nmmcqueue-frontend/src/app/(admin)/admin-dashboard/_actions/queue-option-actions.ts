"use server";
import { API_URL, getAuthHeaders } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function getQueueOptions(departmentName: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options?departmentName=${encodeURIComponent(departmentName)}`, {
        headers: await getAuthHeaders()
    });
    if (!res.ok) return ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];
    const json = await res.json();
    return json.data;
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    const res = await fetch(`${API_URL}/clinic/queue-options/batch`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ departments: departmentNames })
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data;
}

export async function createQueueOption(departmentName: string, option: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ departmentName, option })
    });
    if (res.ok) {
        revalidatePath("/admin-departments");
        revalidatePath("/admin-caller");
    }
    return res.json();
}

export async function deleteQueueOption(departmentName: string, option: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ departmentName, option })
    });
    if (res.ok) {
        revalidatePath("/admin-departments");
        revalidatePath("/admin-caller");
    }
    return res.json();
}
