import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { KioskFormValues } from "../schemas";

interface KioskState {
  draft: Partial<KioskFormValues>;
  _hasHydrated: boolean;
  
  // Actions
  updateDraft: (data: Partial<KioskFormValues>) => void;
  clearDraft: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useKioskStore = create<KioskState>()(
  persist(
    (set) => ({
      draft: {},
      _hasHydrated: false,

      updateDraft: (data) => 
        set((state) => ({ 
          draft: { ...state.draft, ...data } 
        })),

      clearDraft: () => set({ draft: {} }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "kiosk-form-draft",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      }
    }
  )
);
