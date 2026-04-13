import { create } from "zustand";
import { VisitWithPatient } from "../types";

interface TriageState {
  isManualEntry: boolean;
  selectedPatient: VisitWithPatient | null;
  submitError: string;
  isPanelOpen: boolean;

  // Actions
  setManualEntry: (isManual: boolean) => void;
  setSelectedPatient: (patient: VisitWithPatient | null) => void;
  setSubmitError: (error: string) => void;
  resetTriage: () => void;
}

export const useTriageStore = create<TriageState>((set) => ({
  isManualEntry: false,
  selectedPatient: null,
  submitError: "",
  isPanelOpen: false,

  setManualEntry: (isManualEntry) => set({ 
    isManualEntry, 
    selectedPatient: null, // Clearing selection when toggling manual mode
    isPanelOpen: true,
    submitError: ""
  }),
  
  setSelectedPatient: (selectedPatient) => set({ 
    selectedPatient, 
    isManualEntry: false, 
    isPanelOpen: !!selectedPatient,
    submitError: "" 
  }),

  setSubmitError: (submitError) => set({ submitError }),

  resetTriage: () => set({ 
    isManualEntry: false, 
    selectedPatient: null, 
    isPanelOpen: false,
    submitError: "" 
  }),
}));
