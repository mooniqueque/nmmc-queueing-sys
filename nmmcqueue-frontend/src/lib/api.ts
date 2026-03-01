import { headers } from "next/headers";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getAuthHeaders() {
    const reqHeaders = await headers();
    return {
        "Content-Type": "application/json",
        "cookie": reqHeaders.get("cookie") || ""
    };
}
