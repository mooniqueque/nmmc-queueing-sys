import { VisitStatus } from '@prisma/client';

export type ClaimWorkflow = 'TRIAGE' | 'WINDOW';

interface ClaimPatchInput {
    workflow: ClaimWorkflow;
    userId: string;
    workstationId?: string | null;
    stationNo?: number | null;
}

export const claimErrorCodes = {
    conflict: 'CLAIM_CONFLICT',
    assignmentRequired: 'CALLER_ASSIGNMENT_REQUIRED',
};

export function buildClaimPatch(input: ClaimPatchInput) {
    const now = new Date();

    if (input.workflow === 'TRIAGE') {
        return {
            status: 'IN_TRIAGE' as VisitStatus,
            triageClaimedById: input.userId,
            triageStartedAt: now,
            triageStationId: input.workstationId ?? null,
            // Clear other workflow ownership to guarantee single active owner.
            windowClaimedById: null,
            windowStartedAt: null,
            calledByUserId: null,
            calledAtStationId: null,
            calledAt: null,
            windowNumber: null,
        };
    }

    return {
        status: 'IN_WINDOW' as VisitStatus,
        windowClaimedById: input.userId,
        windowStartedAt: now,
        calledAt: now,
        calledByUserId: input.userId,
        calledAtStationId: input.workstationId ?? null,
        windowNumber: input.stationNo ?? null,
        // Clear triage claim ownership once window takes over.
        triageClaimedById: null,
        triageStartedAt: null,
    };
}

export function buildReleasePatch(status: VisitStatus) {
    return {
        status,
        triageClaimedById: null,
        triageStartedAt: null,
        windowClaimedById: null,
        windowStartedAt: null,
    };
}
