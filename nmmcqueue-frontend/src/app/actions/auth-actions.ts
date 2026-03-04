"use server";
import * as authApi from "@/lib/api/auth";
import { getServerHeaders } from "@/lib/api/index";
import { revalidatePath } from "next/cache";

export async function revokeAllSessions() {
    const result = await authApi.revokeAllSessions({
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/");
    return result;
}
