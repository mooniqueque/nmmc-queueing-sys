"use server";
import { getServerHeaders } from "@/lib/api/index";
import * as triageApi from "@/lib/api/triage";
import { revalidatePath } from "next/cache";

export async function submitTriageForm(
    values: Record<string, unknown>,
    visitId?: string
) {
    const result = await triageApi.submitTriageForm(values, visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/triage");
    return result;
}

export async function getPendingQueue() {
    return triageApi.getPendingQueue({
        headers: await getServerHeaders(),
    });
}

export async function markNoShow(visitId: string) {
    const result = await triageApi.markNoShow(visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/triage");
    return result;
}

export async function restoreNoShow(visitId: string) {
    const result = await triageApi.restoreNoShow(visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/triage");
    return result;
}

export async function removeQueue(visitId: string) {
    const result = await triageApi.removeQueue(visitId, {
        headers: await getServerHeaders(),
    });
    if (result.success) revalidatePath("/triage");
    return result;
}
