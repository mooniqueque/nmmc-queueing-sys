"use server";
import { getServerHeaders } from "@/lib/api/server";
import * as releasingApi from "@/features/releasing/api";
import { revalidatePath } from "next/cache";

export async function getPendingQueue() {
    return releasingApi.getPendingQueue({
        headers: await getServerHeaders(),
    });
}

export async function callTicket(visitId: string) {
    const result = await releasingApi.callTicket(visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/releasing", "page");
    return result;
}

export async function noShowTicket(visitId: string) {
    const result = await releasingApi.noShowTicket(visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/releasing", "page");
    return result;
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
