import { API_URL } from "./index";

export async function getAllDepartments() {
    try {
        const response = await fetch(`${API_URL}/shared/departments`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch departments: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle success wrapper object
        if (data.success && data.data && Array.isArray(data.data)) {
            return data.data.map((dept: any) => ({
                id: dept.id,
                name: dept.name,
            }));
        }

        // Handle direct array response
        if (Array.isArray(data)) {
            return data.map((dept: any) => ({
                id: dept.id,
                name: dept.name,
            }));
        }

        return [];
    } catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
}
