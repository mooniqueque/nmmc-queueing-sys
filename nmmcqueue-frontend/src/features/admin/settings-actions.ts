"use server";
import { revalidatePath } from "next/cache";
import * as adminApi from "./api";
import { getServerHeaders } from "@/lib/api/server";

export async function resetDailySequences() {
    try {
        const result = await adminApi.resetTickets({
            headers: await getServerHeaders(),
        });

        if (result.success) {
            // Revalidate queues that depend on the active ticket sequence
            revalidatePath("/admin-dashboard");
            revalidatePath("/triage");
            revalidatePath("/caller");
            revalidatePath("/monitor");
        }

        return result;
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to reset ticket sequences." 
        };
    }
}
