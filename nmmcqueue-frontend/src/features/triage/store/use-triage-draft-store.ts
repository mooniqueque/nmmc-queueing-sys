import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TriageFormInput } from "../schemas";

const STORAGE_KEY = "nmmc-triage-draft";
const DRAFT_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

interface TriageDraftState {
  /** Partial form values captured from the active assessment */
  draft: Partial<TriageFormInput> | null;
  /** The visit ID the draft belongs to (null = walk-in / manual entry) */
  visitId: string | null;
  /** Timestamp of last auto-save (epoch ms) */
  lastSavedAt: number | null;

  // Actions
  saveDraft: (values: Partial<TriageFormInput>, visitId: string | null) => void;
  clearDraft: () => void;
  getDraft: (currentVisitId: string | null) => Partial<TriageFormInput> | null;
}

export const useTriageDraftStore = create<TriageDraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      visitId: null,
      lastSavedAt: null,

      saveDraft: (values, visitId) =>
        set({
          draft: values,
          visitId,
          lastSavedAt: Date.now(),
        }),

      clearDraft: () =>
        set({
          draft: null,
          visitId: null,
          lastSavedAt: null,
        }),

      getDraft: (currentVisitId) => {
        const { draft, visitId, lastSavedAt } = get();

        // No draft saved
        if (!draft || lastSavedAt === null) return null;

        // Staleness check — discard drafts older than one shift
        if (Date.now() - lastSavedAt > DRAFT_TTL_MS) {
          get().clearDraft();
          return null;
        }

        // Visit mismatch — draft belongs to a different patient
        if (visitId !== currentVisitId) return null;

        return draft;
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
