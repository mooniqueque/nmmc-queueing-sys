import { headers } from "next/headers";

/**
 * Base URL for the Backend API
 * Uses NEXT_PUBLIC_API_URL if defined, otherwise defaults to localhost:3001/api
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Retrieves cookies and other necessary headers from the current request
 * to be passed down to the backend API during server-side calls (Server Actions/Components).
 */
export async function getServerHeaders() {
    const headerList = await headers();
    const cookie = headerList.get("cookie");

    return {
        ...(cookie ? { cookie } : {}),
    } as HeadersInit;
}
