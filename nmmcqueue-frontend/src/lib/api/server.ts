import { headers } from "next/headers";

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
