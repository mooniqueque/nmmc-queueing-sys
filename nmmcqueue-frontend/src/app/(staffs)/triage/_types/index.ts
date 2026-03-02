import { Department, Patient, Visit } from "@/types/models";

export type VisitWithPatient = Visit & {
    patient: Patient;
    department?: Department | null;
    priorityClass?: string | null;
};
