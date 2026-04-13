/**
 * Releasing (Window Clerk) API Client
 *
 * Typed fetch wrappers for the /api/releasing backend module.
 */
import { API_URL } from "@/lib/api";

export async function getPendingQueue(options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/pending`, {
        cache: "no-store",
        ...options,
    });
    return res.json();
}

export async function callTicket(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/call`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function noShowTicket(visitId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/noshow`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function assignTicket(
    visitId: string,
    departmentId: string,
    priorityClass: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/assign`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ departmentId, priorityClass }),
    });
    return res.json();
}

export async function linkPatient(
    visitId: string,
    hospitalId: string,
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/link-patient`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ hospitalId }),
    });
    return res.json();
}

export async function updatePatientDemographics(
    visitId: string,
    data: {
        firstName: string;
        middleName?: string;
        lastName: string;
        address?: string;
        dateOfBirth: string;
        gender: string;
        contactNo?: string;
        civilStatus?: string;
        birthPlace?: string;
        religion?: string;
    },
    options?: RequestInit
) {
    const res = await fetch(`${API_URL}/releasing/${visitId}/patient-demographics`, {
        method: "PUT",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function resetDailyQueue(options?: RequestInit) {
    const res = await fetch(`${API_URL}/tickets/reset`, {
        method: "POST",
        ...options,
    });
    return res.json();
}

export async function callNextWindow(overrideClassification?: 'PRIORITY' | 'REGULAR', options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/call-next`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ overrideClassification }),
    });
    return res.json();
}

export async function callPriorityClass(priorityTemplateId: string, options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/call-priority-class`, {
        method: "POST",
        ...options,
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: JSON.stringify({ priorityTemplateId }),
    });
    return res.json();
}

export async function getMyCurrentWindowVisit(options?: RequestInit) {
    const res = await fetch(`${API_URL}/releasing/my-current`, {
        cache: "no-store",
        ...options,
    });
    return res.json();
}
