"use server";

import { auth } from "@/lib/database/auth";
import { db as prisma } from "@/lib/database/prisma";
import { triageFormSchema, TriageFormValues } from "@/lib/schemas/triage-schema";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function submitTriageAction(values: TriageFormValues, visitId?: string) {
    try {
        const reqHeaders = await headers();
        const session = await auth.api.getSession({
            headers: reqHeaders
        });

        if (!session || session.user.role !== "TRIAGE_NURSE") {
            return { error: "Unauthorized: Only Triage Nurses can submit this form." };
        }

        const validData = await triageFormSchema.parseAsync(values);

        const triageUpdates = {
            bloodPressure: validData.bloodPressure,
            heartRate: validData.heartRate,
            respiratoryRate: validData.respiratoryRate,
            temperature: validData.temperature,
            oxygenSat: validData.oxygenSat,
            hasFever: validData.hasFever,
            hasCough: validData.hasCough,
            hasColds: validData.hasColds,
            hasRashes: validData.hasRashes,
            isInfectious: validData.isInfectious,
            chiefComplaint: validData.chiefComplaint,
            medicalHistory: validData.medicalHistory,
            triageRemarks: validData.triageRemarks,
            disposition: validData.disposition,
            priorityClass: validData.priorityClass,
            triagedAt: new Date(),
            triagedByUserId: session.user.id,
            status: "WAITING_CLINIC" // Proceed to the next step
        };

        if (validData.isManualEntry) {
            // Walk-in / Manual Entry: We create the Patient and Visit together.
            if (!validData.firstName || !validData.lastName || !validData.dateOfBirth || !validData.gender) {
                return { error: "Missing required demographic fields for Walk-In." };
            }

            // To avoid duplicates, check if patient exists
            let patient = await prisma.patient.findFirst({
                where: {
                    firstName: validData.firstName,
                    lastName: validData.lastName,
                    dateOfBirth: new Date(validData.dateOfBirth)
                }
            });

            if (!patient) {
                patient = await prisma.patient.create({
                    data: {
                        firstName: validData.firstName,
                        lastName: validData.lastName,
                        dateOfBirth: new Date(validData.dateOfBirth),
                        gender: validData.gender
                    }
                });
            }

            // Determine next ticket number for today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const latestVisit = await prisma.visit.findFirst({
                where: {
                    createdAt: { gte: startOfDay }
                },
                orderBy: { ticketNumber: 'desc' }
            });

            const nextTicketNumber = (latestVisit?.ticketNumber || 0) + 1;

            // Create the visit directly into TRIAGED/WAITING_CLINIC status
            await prisma.visit.create({
                data: {
                    patientId: patient.id,
                    ticketNumber: nextTicketNumber,
                    ...triageUpdates
                }
            });

        } else {
            // Existing Queue Patient: Update their existing Kiosk Visit record
            if (!visitId) {
                return { error: "No Visit ID provided for queue patient." };
            }

            await prisma.visit.update({
                where: { id: visitId },
                data: triageUpdates
            });
        }

        revalidatePath("/triage");
        return { success: true };

    } catch (error: unknown) {
        console.error("Triage Submission Error:", error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: "An unexpected error occurred." };
    }
}
