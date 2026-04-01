import { API_URL } from "@/lib/api";

export async function resetTickets(options?: RequestInit) {
    const res = await fetch(`${API_URL}/tickets/reset`, {
        method: "POST",
        ...options,
    });

    if (!res.ok) {
        throw new Error("Failed to reset tickets.");
    }

    return res.json();
}
