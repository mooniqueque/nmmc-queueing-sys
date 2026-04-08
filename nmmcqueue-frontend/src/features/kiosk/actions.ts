"use server";
import * as triageApi from "@/features/triage/api";

export async function registerKioskPatient(data: Record<string, unknown>) {
    return triageApi.registerKioskPatient(data);
}
