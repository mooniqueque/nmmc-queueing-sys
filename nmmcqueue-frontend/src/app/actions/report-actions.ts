"use server";
import { getServerHeaders } from "@/lib/api/index";
import * as reportsApi from "@/lib/api/reports";

export async function fetchReportVisitsAPI(filters: Record<string, unknown>) {
    return reportsApi.fetchReportVisits(filters, {
        headers: await getServerHeaders(),
    });
}

export async function fetchDistinctStatusesAPI() {
    return reportsApi.fetchDistinctStatuses({
        headers: await getServerHeaders(),
    });
}
