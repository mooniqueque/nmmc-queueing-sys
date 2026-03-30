/**
 * Triage API Client
 *
 * Typed fetch wrappers for the /api/triage backend module.
 * Covers both public kiosk endpoints and protected triage nurse endpoints.
 */
import { API_URL } from "@/lib/api";

// ─── Public (Kiosk) ──────────────────────────────────────────
export async function registerKioskPatient(data: Record<string, unknown>) {
    const res = await fetch(`${API_URL}/triage/kiosk/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function getPatientByHospitalId(hospitalId: string) {
    const res = await fetch(
        `${API_URL}/triage/kiosk/patient/${encodeURIComponent(hospitalId)}`
    );
    if (!res.ok) return { success: false, error: "Patient not found" };
    return res.json();
}

// ─── Protected (Triage Nurse / Admin) ─────────────────────────
export async function submitTriageForm(
    values: Record<string, unknown>,
    visitId?: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/triage/submit`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ values, visitId }),
    });
    return res.json();
}

export async function getPendingQueue(options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/pending`, {
        cache: "no-store",
        ...options,
    });
    return res.json();
}

export async function markNoShow(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/${visitId}/no-show`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function restoreNoShow(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/${visitId}/restore`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function searchPatients(query: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/patients/search?q=${encodeURIComponent(query)}`, {
        ...options,
    });
    return res.json();
}

export async function mergePatient(visitId: string, targetPatientId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/${visitId}/merge-patient`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ targetPatientId }),
        ...options,
    });
    return res.json();
}

export async function removeQueue(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/${visitId}`, {
        method: "DELETE",
        ...options,
    });
    return res.json();
}

export async function callNextTriage(options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/call-next`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function getMyCurrentTriageVisit(options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/my-current`, {
        cache: "no-store",
        ...options,
    });
    return res.json();
}

export async function callSpecificTriage(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/triage/${visitId}/call-specific`, {
        method: "POST",
        ...options,
    });
    return res.json();
}
