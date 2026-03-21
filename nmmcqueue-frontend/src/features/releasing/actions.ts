"use server";
import * as releasingApi from "@/features/releasing/api";
import { getServerHeaders } from "@/lib/api/server";
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

export async function resetDailyQueue() {
    const result = await releasingApi.resetDailyQueue({
        headers: await getServerHeaders(),
    });
    if (result.success) {
        revalidatePath("/releasing", "page");
        revalidatePath("/kiosk", "page");
        revalidatePath("/triage", "page");
    }
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

export async function callNextWindow(overrideClassification?: 'PRIORITY' | 'REGULAR') {
    const result = await releasingApi.callNextWindow(overrideClassification, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/releasing", "page");
    return result;
}

export async function getMyCurrentWindowVisit() {
    return releasingApi.getMyCurrentWindowVisit({
        headers: await getServerHeaders(),
    });
}
