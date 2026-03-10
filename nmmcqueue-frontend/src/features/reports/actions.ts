"use server";
import { getServerHeaders } from "@/lib/api/server";
import * as reportsApi from "@/features/reports/api";

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
