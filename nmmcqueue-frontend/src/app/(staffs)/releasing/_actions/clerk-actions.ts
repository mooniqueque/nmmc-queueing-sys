"use server";
import { getServerHeaders } from "@/lib/api/index";
import * as releasingApi from "@/lib/api/releasing";
import { revalidatePath } from "next/cache";

export async function getPendingQueue() {
    return releasingApi.getPendingQueue({
        headers: await getServerHeaders(),
    });
}

export async function assignTicket(
    visitId: string,
    departmentId: string,
    priorityClass: string
) {
    const result = await releasingApi.assignTicket(
        visitId,
        departmentId,
        priorityClass,
        { headers: await getServerHeaders() }
    );
    if (result.success) revalidatePath("/releasing", "page");
    return result;
}
