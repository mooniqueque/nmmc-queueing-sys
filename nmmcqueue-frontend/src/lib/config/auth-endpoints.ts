const DEFAULT_API_URL = "http://localhost:3005/api";

function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, "");
}

export const API_URL = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);
export const AUTH_BASE_URL = `${API_URL}/auth`;
export const AUTH_GET_SESSION_URL = `${AUTH_BASE_URL}/get-session`;

export interface SessionUserLike {
    role?: string;
    [key: string]: unknown;
}

export interface SessionLike {
    user: SessionUserLike;
    [key: string]: unknown;
}

export function hasSessionUser(value: unknown): value is SessionLike {
    if (!value || typeof value !== "object") return false;

    const user = (value as { user?: unknown }).user;
    return !!user && typeof user === "object";
}
