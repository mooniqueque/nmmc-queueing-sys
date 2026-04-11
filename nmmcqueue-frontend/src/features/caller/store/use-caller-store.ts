import { Department } from "@/shared/types/models";
import { create } from "zustand";

export type CallerTab = "waitlist" | "noshow" | "reports" | "referrals";

interface CallerState {
  activeTab: CallerTab;
  isProcessing: boolean;
  allDepartments: Department[];
  isReferralModalOpen: boolean;
  targetDeptId: string;

  // Actions
  setActiveTab: (tab: CallerTab) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setDepartments: (departments: Department[]) => void;
  setReferralModalOpen: (isOpen: boolean) => void;
  setTargetDeptId: (id: string) => void;
  resetReferral: () => void;
}

export const useCallerStore = create<CallerState>((set) => ({
  activeTab: "waitlist",
  isProcessing: false,
  allDepartments: [],
  isReferralModalOpen: false,
  targetDeptId: "",

  setActiveTab: (activeTab) => set({ activeTab }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setDepartments: (allDepartments) => set({ allDepartments }),
  setReferralModalOpen: (isReferralModalOpen) => set({ isReferralModalOpen }),
  setTargetDeptId: (targetDeptId) => set({ targetDeptId }),
  resetReferral: () => set({ isReferralModalOpen: false, targetDeptId: "" }),
}));
