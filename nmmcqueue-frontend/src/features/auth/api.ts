/**
 * Auth API Client
 *
 * Typed fetch wrappers for the /api/auth and /api/users backend modules.
 */
import { API_URL } from "@/lib/api";

// ─── Session ──────────────────────────────────────────────────
export async function revokeAllSessions(options?: RequestInit) {
    const res = await fetch(`${API_URL}/auth/revoke-all-sessions`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

// ─── User Management (Admin) ─────────────────────────────────
export async function getAllUsers(options?: RequestInit) {
    const res = await fetch(`${API_URL}/users`, options);
    if (!res.ok) throw new Error("Unable to retrieve user list.");
    const json = await res.json();
    return json.data;
}

export async function adminCreateUser(
    data: Record<string, unknown>,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/users/create`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function updateUserRole(
    userId: string,
    newRole: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: "PUT",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ role: newRole }),
    });
    return res.json();
}

export async function toggleUserStatus(
    userId: string,
    status: boolean,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PUT",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ status }),
    });
    return res.json();
}

export async function updateUserDepartment(
    userId: string,
    department: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/users/${userId}/department`, {
        method: "PUT",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ department }),
    });
    return res.json();
}

export async function getUserDepartmentAssignments(userId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/users/${userId}/departments`, options);
    if (!res.ok) throw new Error("Unable to retrieve department assignments.");
    return res.json();
}

export async function updateUserDepartmentAssignments(
    userId: string,
    assignments: Array<{ departmentId: string; isEnabled: boolean }>,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/users/${userId}/departments`, {
        method: "PUT",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ assignments }),
    });
    return res.json();
}
