import { Department, Patient, Visit } from "@/types/models";

export type VisitWithPatient = Visit & {
    patient: Patient;
    department?: Department | null;
    referredFrom?: Department | null;
    priorityClass?: string | null;
};
