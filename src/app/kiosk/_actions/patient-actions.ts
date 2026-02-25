"use server";

import { db as prisma } from "@/lib/database/prisma";
import { eventBus } from "@/lib/sse-emitter";
import { revalidatePath } from "next/cache";

/**
 * ACTION: getPatientByHospitalId
 * Securely fetches a returning patient's profile to auto-fill the Kiosk form.
 */

export async function getPatientByHospitalId(hospitalId: string) {
    try {
        const patient = await prisma.patient.findUnique({
            where: {
                hospitalId: hospitalId.trim()
            }
        });
        if (!patient) {
            return { success: false, error: "Hospital ID not found. Please register as a new patient" };
        };
        return { success: true, data: patient };
    } catch (error) {
        console.error("Failed to fetch patient:", error);
        return { success: false, error: "Database error while searching." };
    }
}


/**
 * ACTION: submitKioskRegistration
 * This safely takes data from the public Kiosk form and creates a new Visit.
 */
export async function submitKioskRegistration(formData: FormData) {
    try {
        const hospitalIdInput = formData.get("hospitalId") as string | null;

        // 1. Extract raw data from the form
        const rawData = {
            firstName: formData.get("firstName") as string,
            middleName: formData.get("middleName") as string | null,
            lastName: formData.get("lastName") as string,
            dateOfBirth: new Date(formData.get("dateOfBirth") as string),
            gender: formData.get("gender") as string,
            hospitalId: hospitalIdInput && hospitalIdInput.trim() !== "" ? hospitalIdInput.trim() : null, // Fixes Unique Constraint!
            address: formData.get("address") as string,
            birthPlace: formData.get("birthPlace") as string,
            religion: formData.get("religion") as string,
            civilStatus: formData.get("civilStatus") as string,
        };
        const hasAppointment = formData.get("hasAppointment") === "true" || formData.get("hasAppointment") === "on";

        // 2. Validate essential fields (Basic check)
        if (!rawData.firstName || !rawData.lastName || !rawData.gender) {
            return { success: false, error: "Missing required fields." };
        }

        // 3. Database Writing Logic
        // We use Prisma Transactions so both operations succeed or both fail together
        await prisma.$transaction(async (tx) => {
            let patient;

            // Step A: Handle the Patient Record
            if (rawData.hospitalId) {
                // If they have an ID, update their existing record just in case info changed
                patient = await tx.patient.upsert({
                    where: { hospitalId: rawData.hospitalId },
                    update: { ...rawData },
                    create: { ...rawData },
                });
            } else {
                // No Hospital ID provided. Check if they                // STRICT MATCHING: Check First, Last Name AND Date of Birth to avoid Junior/Senior mixups
                patient = await tx.patient.findFirst({
                    where: {
                        firstName: rawData.firstName,
                        lastName: rawData.lastName,
                        dateOfBirth: rawData.dateOfBirth
                    }
                });

                if (patient) {
                    patient = await tx.patient.update({
                        where: { id: patient.id },
                        data: { ...rawData }
                    });
                } else {
                    patient = await tx.patient.create({
                        data: { ...rawData },
                    });
                }
            }

            // Step B: DUPLICATE CHECK FOR REENTERING QUEUE
            // See if this patient already has an active queue entry TODAY.
            // If they queued yesterday and left, that's fine, let them queue again today.
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset to midnight

            const existingVisit = await tx.visit.findFirst({
                where: {
                    patientId: patient.id,
                    createdAt: {
                        gte: today // Only check visits created today!
                    },
                    status: {
                        in: ["KIOSK_SUBMITTED", "TRIAGED", "WAITING_CLINIC"]
                    }
                }
            });

            if (existingVisit) {
                throw new Error("ALREADY_IN_QUEUE");
            }

            // Determine next ticket number atomically to prevent race conditions
            const sequence = await tx.sequence.upsert({
                where: { name: 'DAILY_QUEUE' },
                update: { value: { increment: 1 } },
                create: { name: 'DAILY_QUEUE', value: 1 }
            });

            // Step C: Create their Visit (Queue Entry)
            await tx.visit.create({
                data: {
                    patientId: patient.id,
                    status: "KIOSK_SUBMITTED",
                    ticketNumber: sequence.value,
                    hasAppointment: hasAppointment
                }
            });
        });

        // 4. Force the Triage Dashboard to instantly refresh without reloading the page!
        revalidatePath("/triage");

        // 5. Trigger the Real-Time Server-Sent Event for any open dashboards!
        eventBus.emit('queue-updated');

        return { success: true, message: "Successfully queued for Triage." };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Handle our custom duplicate error
        if (errorMessage === "ALREADY_IN_QUEUE") {
            return { success: false, error: "Your name is already in the queue. Please sit and wait to be called. (PALIHOG UG HULAT TAWAGON IMONG NGALAN, AYAW NA UTRO UG BALIK UG SUBMIT)" };
        }

        console.error("Kiosk Registration Failed:", errorMessage);
        return { success: false, error: "Failed to submit registration. Please try again." };
    }
}
