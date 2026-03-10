"use server";
import * as callerApi from "@/features/caller/api";
import { getServerHeaders } from "@/lib/api/server";

export async function getClinicQueues(departmentName?: string) {
    return callerApi.getClinicQueues(departmentName, {
        headers: await getServerHeaders(),
    });
}
