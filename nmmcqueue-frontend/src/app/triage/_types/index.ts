import { Patient, Visit } from "@/types/models";

export type VisitWithPatient = Visit & {
    patient: Patient;
};
