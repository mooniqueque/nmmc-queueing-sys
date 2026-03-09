"use server";
import * as callerApi from "@/features/caller/api";
import { getServerHeaders } from "@/lib/api/index";

export async function getClinicQueues(departmentName?: string) {
    return callerApi.getClinicQueues(departmentName, {
        headers: await getServerHeaders(),
    });
}
