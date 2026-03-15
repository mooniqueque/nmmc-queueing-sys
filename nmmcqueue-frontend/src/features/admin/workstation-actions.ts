"use server";
import { getServerHeaders } from "@/lib/api/server";
import { revalidatePath } from "next/cache";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function getWorkstations() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/workstations`, {
            headers: await getServerHeaders(),
        });
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch workstations:", error);
        return { success: false, error: "Failed to load workstations" };
    }
}

export async function createWorkstation(data: { name: string, type: string, stationNo: number, departmentId?: string }) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/workstations`, {
            method: "POST",
            headers: {
                ...(await getServerHeaders()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-dashboard/settings");
        return result;
    } catch (error) {
        console.error("Create WS Error:", error);
        return { success: false, error: "Failed to create workstation" };
    }
}

export async function updateWorkstation(id: string, data: Partial<{ name: string, type: string, stationNo: number, departmentId?: string }>) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/workstations/${id}`, {
            method: "PUT",
            headers: {
                ...(await getServerHeaders()),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-dashboard/settings");
        return result;
    } catch (error) {
        console.error("Update WS Error:", error);
        return { success: false, error: "Failed to update workstation" };
    }
}

export async function deleteWorkstation(id: string) {
    try {
        const response = await fetch(`${BACKEND_URL}/api/workstations/${id}`, {
            method: "DELETE",
            headers: await getServerHeaders(),
        });
        const result = await response.json();
        if (result.success) revalidatePath("/admin-dashboard/settings");
        return result;
    } catch (error) {
        console.error("Delete WS Error:", error);
        return { success: false, error: "Failed to delete workstation" };
    }
}
