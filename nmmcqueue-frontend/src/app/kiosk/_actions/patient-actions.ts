"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function registerKioskPatient(data: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/triage/kiosk/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function getPatientByHospitalId(hospitalId: string) {
    const res = await fetch(`${API_URL}/triage/kiosk/patient/${encodeURIComponent(hospitalId)}`);
    if (!res.ok) return { success: false, error: "Patient not found" };
    return res.json();
}
