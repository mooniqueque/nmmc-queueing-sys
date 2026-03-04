"use server";
import * as callerApi from "@/lib/api/caller";
import { getServerHeaders } from "@/lib/api/index";

export async function getClinicQueues(departmentName?: string) {
    return callerApi.getClinicQueues(departmentName, {
        headers: await getServerHeaders(),
    });
}
