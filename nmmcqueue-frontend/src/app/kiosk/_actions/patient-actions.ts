"use server";
import * as triageApi from "@/lib/api/triage";

export async function registerKioskPatient(data: Record<string, unknown>) {
    return triageApi.registerKioskPatient(data);
}

export async function getPatientByHospitalId(hospitalId: string) {
    return triageApi.getPatientByHospitalId(hospitalId);
}
