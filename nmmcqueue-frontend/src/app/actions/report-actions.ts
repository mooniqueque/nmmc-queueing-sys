"use server";
import { headers } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(reqHeaders: Headers) {
    return {
        "Content-Type": "application/json",
        "cookie": reqHeaders.get("cookie") || ""
    };
}

export async function fetchReportVisitsAPI(filters: Record<string, unknown>) {
    try {
        const res = await fetch(`${API_URL}/reports/visits`, {
            method: "POST",
            headers: getHeaders(await headers()),
            body: JSON.stringify(filters)
        });
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}

export async function fetchDistinctStatusesAPI() {
    try {
        const res = await fetch(`${API_URL}/reports/statuses`, {
            headers: getHeaders(await headers())
        });
        if (!res.ok) return { success: false, data: [] };
        return res.json();
    } catch {
        return { success: false, data: [] };
    }
}
