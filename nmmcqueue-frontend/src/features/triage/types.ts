import { Department, Patient, Visit, WorkStation } from "@/shared/types/models";

export type VisitWithPatient = Visit & {
    patient: Patient;
    department?: Department | null;
    referredFrom?: Department | null;
    originStation?: WorkStation | null;
    triageStation?: WorkStation | null;
};
