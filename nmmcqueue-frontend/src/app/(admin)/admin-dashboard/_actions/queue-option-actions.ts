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

export async function getQueueOptions(departmentName: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options?departmentName=${encodeURIComponent(departmentName)}`, {
        headers: getHeaders(await headers())
    });
    if (!res.ok) return ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"];
    const json = await res.json();
    return json.data;
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    const res = await fetch(`${API_URL}/clinic/queue-options/batch`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ departments: departmentNames })
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data;
}

export async function createQueueOption(departmentName: string, option: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ departmentName, option })
    });
    if (res.ok) {
        revalidatePath("/departments");
        revalidatePath("/caller");
    }
    return res.json();
}

export async function deleteQueueOption(departmentName: string, option: string) {
    const res = await fetch(`${API_URL}/clinic/queue-options`, {
        method: "DELETE",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ departmentName, option })
    });
    if (res.ok) {
        revalidatePath("/departments");
        revalidatePath("/caller");
    }
    return res.json();
}
