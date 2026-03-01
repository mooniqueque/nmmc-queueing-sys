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

export async function getPendingQueue() {
    const res = await fetch(`${API_URL}/clerk/pending`, {
        headers: getHeaders(await headers()),
        cache: "no-store"
    });
    const json = await res.json();
    return json;
}

export async function assignTicket(visitId: string, departmentId: string, priorityClass: string) {
    const res = await fetch(`${API_URL}/clerk/${visitId}/assign`, {
        method: "POST",
        headers: getHeaders(await headers()),
        body: JSON.stringify({ departmentId, priorityClass })
    });
    if (res.ok) {
        revalidatePath("/(admin)/releasing", "page");
    }
    return res.json();
}
