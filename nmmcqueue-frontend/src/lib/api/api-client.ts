import type { ApiResponse } from "@nmmc/types";
import { API_URL } from "./index";

export class ApiClientError extends Error {
    status: number;
    code?: string;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = "ApiClientError";
        this.status = status;
        this.code = code;
    }
}

export async function apiClient<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${API_URL}${path}`, options);
    const payload = (await res.json().catch(() => ({}))) as ApiResponse<T>;

    if (!res.ok || payload?.success === false) {
        throw new ApiClientError(
            payload?.message || payload?.error || "Request failed",
            res.status,
            payload?.code
        );
    }

    return payload;
}
