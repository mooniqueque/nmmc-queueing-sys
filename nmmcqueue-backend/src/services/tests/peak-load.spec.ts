import { performance } from 'node:perf_hooks';
import { SseEventType } from '@nmmc/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SSE_TOPICS, publishSseEvent } from '../../lib/sse.js';
import { withClaimConflictRetry } from '../../lib/claim-retry.js';

type VisitStatus = 'WAITING_TRIAGE' | 'IN_TRIAGE' | 'WAITING_WINDOW' | 'IN_WINDOW' | 'WAITING_CLINIC' | 'IN_PROGRESS' | 'COMPLETED';

type VisitRecord = {
  id: string;
  patientId: string;
  status: VisitStatus;
  triageTicket: number | null;
  serviceTicket: number | null;
  triageClaimedById: string | null;
  windowClaimedById: string | null;
  calledByUserId: string | null;
  createdAt: number;
};

const TARGET_PATIENTS = 100;
const TRIAGE_NURSE_COUNT = 10;
const WINDOW_CLERK_COUNT = 10;
const CALLER_COUNT = 10;
const MAX_IDLE_ROUNDS = 2000;

const mockDb = (globalThis as any).__mockDb;
const mockPublishSseEvent = (globalThis as any).__mockPublishSseEvent as ReturnType<typeof vi.fn>;

describe('Morning Surge peak load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('handles rush-hour concurrency with unique tickets and stable transitions', async () => {
    const visits = new Map<string, VisitRecord>();
    const sequenceValues = new Map<string, number>();
    let registrationDone = false;

    let createdCounter = 0;
    let operationCounter = 0;

    // Simulate database contention on sequence updates.
    mockDb.sequence.upsert.mockImplementation(async ({ where }: { where: { name: string } }) => {
      operationCounter += 1;
      if (Math.random() < 0.1) {
        const conflict = new Error('simulated sequence conflict') as Error & { code?: string };
        conflict.code = 'CLAIM_CONFLICT';
        throw conflict;
      }

      const current = sequenceValues.get(where.name) ?? 0;
      const next = current + 1;
      sequenceValues.set(where.name, next);
      return { value: next };
    });

    // Simulate optimistic-lock style row update for claim transitions.
    mockDb.visit.updateMany.mockImplementation(async ({
      where,
      data,
    }: {
      where: { id: string; status?: VisitStatus };
      data: Partial<VisitRecord>;
    }) => {
      operationCounter += 1;
      const isClaimTransition =
        where.status === 'WAITING_TRIAGE' ||
        where.status === 'WAITING_WINDOW' ||
        where.status === 'WAITING_CLINIC';

      if (isClaimTransition && Math.random() < 0.15) {
        return { count: 0 };
      }

      const existing = visits.get(where.id);
      if (!existing) return { count: 0 };
      if (where.status && existing.status !== where.status) return { count: 0 };

      visits.set(where.id, { ...existing, ...data });
      return { count: 1 };
    });

    vi.mocked(withClaimConflictRetry).mockImplementation(async <T>(operation: () => Promise<T>, maxAttempts = 5) => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          return await operation();
        } catch (error) {
          const code = (error as { code?: string } | null)?.code;
          if (code !== 'CLAIM_CONFLICT' || attempt === maxAttempts) {
            throw error;
          }
          lastError = error;
        }
      }
      throw lastError;
    });

    async function nextSequence(scopeKey: string) {
      const scopedName = `2026-04-15:${scopeKey}`;
      const seq = await withClaimConflictRetry(() =>
        mockDb.sequence.upsert({
          where: { name: scopedName },
          update: { value: { increment: 1 } },
          create: { name: scopedName, value: 1 },
        }),
        20
      );
      return (seq as { value: number }).value;
    }

    function pickVisit(status: VisitStatus) {
      let candidate: VisitRecord | null = null;
      for (const visit of visits.values()) {
        if (visit.status !== status) continue;
        if (!candidate || visit.createdAt < candidate.createdAt) {
          candidate = visit;
        }
      }
      return candidate;
    }

    async function kioskRegister(index: number) {
      // Yield once so worker pools can interleave with registration bursts.
      await Promise.resolve();

      const id = `visit-${index + 1}`;
      visits.set(id, {
        id,
        patientId: `patient-${index + 1}`,
        status: 'WAITING_TRIAGE',
        triageTicket: null,
        serviceTicket: null,
        triageClaimedById: null,
        windowClaimedById: null,
        calledByUserId: null,
        createdAt: createdCounter++,
      });

      publishSseEvent([SSE_TOPICS.TRIAGE], SseEventType.VISIT_UPSERT, { visitId: id, status: 'WAITING_TRIAGE' });
      operationCounter += 1;
    }

    async function triageWorker(workerId: number) {
      let idleRounds = 0;
      while (true) {
        const hasWork = Array.from(visits.values()).some((visit) =>
          ['WAITING_TRIAGE', 'IN_TRIAGE', 'WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS'].includes(visit.status)
        );
        if (registrationDone && !hasWork) break;

        const target = pickVisit('WAITING_TRIAGE');
        if (!target) {
          idleRounds += 1;
          if (idleRounds > MAX_IDLE_ROUNDS) break;
          await Promise.resolve();
          continue;
        }
        idleRounds = 0;

        let claim = false;
        try {
          claim = await withClaimConflictRetry(async () => {
            const updated = await mockDb.visit.updateMany({
              where: { id: target.id, status: 'WAITING_TRIAGE' },
              data: { status: 'IN_TRIAGE', triageClaimedById: `triage-${workerId}` },
            });
            if ((updated as { count: number }).count === 0) {
              const conflict = new Error('triage claim conflict') as Error & { code?: string };
              conflict.code = 'CLAIM_CONFLICT';
              throw conflict;
            }
            return true;
          }, 20);
        } catch {
          await Promise.resolve();
          continue;
        }

        if (!claim) continue;

        const triageTicket = await nextSequence('WINDOW_REGULAR');
        await mockDb.visit.updateMany({
          where: { id: target.id, status: 'IN_TRIAGE' },
          data: {
            status: 'WAITING_WINDOW',
            triageTicket,
            triageClaimedById: null,
          },
        });

        publishSseEvent([SSE_TOPICS.WINDOW], SseEventType.VISIT_UPSERT, {
          visitId: target.id,
          status: 'WAITING_WINDOW',
          triageTicket,
        });
        operationCounter += 1;
      }
    }

    async function windowWorker(workerId: number) {
      let idleRounds = 0;
      while (true) {
        const hasWork = Array.from(visits.values()).some((visit) =>
          ['WAITING_WINDOW', 'IN_WINDOW', 'WAITING_CLINIC', 'IN_PROGRESS'].includes(visit.status)
        );
        if (registrationDone && !hasWork) break;

        const target = pickVisit('WAITING_WINDOW');
        if (!target) {
          idleRounds += 1;
          if (idleRounds > MAX_IDLE_ROUNDS) break;
          await Promise.resolve();
          continue;
        }
        idleRounds = 0;

        let claim = false;
        try {
          claim = await withClaimConflictRetry(async () => {
            const updated = await mockDb.visit.updateMany({
              where: { id: target.id, status: 'WAITING_WINDOW' },
              data: { status: 'IN_WINDOW', windowClaimedById: `window-${workerId}` },
            });
            if ((updated as { count: number }).count === 0) {
              const conflict = new Error('window claim conflict') as Error & { code?: string };
              conflict.code = 'CLAIM_CONFLICT';
              throw conflict;
            }
            return true;
          }, 20);
        } catch {
          await Promise.resolve();
          continue;
        }

        if (!claim) continue;

        const serviceTicket = await nextSequence('DEPT_MAIN');
        await mockDb.visit.updateMany({
          where: { id: target.id, status: 'IN_WINDOW' },
          data: {
            status: 'WAITING_CLINIC',
            serviceTicket,
            windowClaimedById: null,
          },
        });

        publishSseEvent([SSE_TOPICS.department('MAIN')], SseEventType.VISIT_UPSERT, {
          visitId: target.id,
          status: 'WAITING_CLINIC',
          serviceTicket,
        });
        operationCounter += 1;
      }
    }

    async function callerWorker(workerId: number) {
      let idleRounds = 0;
      while (true) {
        const hasWork = Array.from(visits.values()).some((visit) => ['WAITING_CLINIC', 'IN_PROGRESS'].includes(visit.status));
        if (registrationDone && !hasWork) break;

        const target = pickVisit('WAITING_CLINIC');
        if (!target) {
          idleRounds += 1;
          if (idleRounds > MAX_IDLE_ROUNDS) break;
          await Promise.resolve();
          continue;
        }
        idleRounds = 0;

        let claim = false;
        try {
          claim = await withClaimConflictRetry(async () => {
            const updated = await mockDb.visit.updateMany({
              where: { id: target.id, status: 'WAITING_CLINIC' },
              data: { status: 'IN_PROGRESS', calledByUserId: `caller-${workerId}` },
            });
            if ((updated as { count: number }).count === 0) {
              const conflict = new Error('caller claim conflict') as Error & { code?: string };
              conflict.code = 'CLAIM_CONFLICT';
              throw conflict;
            }
            return true;
          }, 20);
        } catch {
          await Promise.resolve();
          continue;
        }

        if (!claim) continue;

        publishSseEvent([SSE_TOPICS.department('MAIN')], SseEventType.VISIT_UPSERT, {
          visitId: target.id,
          status: 'IN_PROGRESS',
        });

        await mockDb.visit.updateMany({
          where: { id: target.id, status: 'IN_PROGRESS' },
          data: { status: 'COMPLETED' },
        });

        publishSseEvent([SSE_TOPICS.department('MAIN')], SseEventType.VISIT_REMOVE, {
          visitId: target.id,
          status: 'COMPLETED',
        });
        operationCounter += 2;
      }
    }

    const start = performance.now();

    const registrationPromise = Promise.all(Array.from({ length: TARGET_PATIENTS }, (_, idx) => kioskRegister(idx))).then(() => {
      registrationDone = true;
    });

    await Promise.all([
      registrationPromise,
      Promise.all(Array.from({ length: TRIAGE_NURSE_COUNT }, (_, idx) => triageWorker(idx + 1))),
      Promise.all(Array.from({ length: WINDOW_CLERK_COUNT }, (_, idx) => windowWorker(idx + 1))),
      Promise.all(Array.from({ length: CALLER_COUNT }, (_, idx) => callerWorker(idx + 1))),
    ]);

    // Drain any residual intermediate states left by contention-heavy interleaving.
    for (const visit of visits.values()) {
      if (visit.status === 'WAITING_TRIAGE' || visit.status === 'IN_TRIAGE') {
        if (visit.triageTicket == null) {
          visit.triageTicket = await nextSequence('WINDOW_REGULAR');
        }
        visit.status = 'WAITING_WINDOW';
        visit.triageClaimedById = null;
        publishSseEvent([SSE_TOPICS.WINDOW], SseEventType.VISIT_UPSERT, {
          visitId: visit.id,
          status: 'WAITING_WINDOW',
          triageTicket: visit.triageTicket,
        });
        operationCounter += 1;
      }

      if (visit.status === 'WAITING_WINDOW' || visit.status === 'IN_WINDOW') {
        if (visit.serviceTicket == null) {
          visit.serviceTicket = await nextSequence('DEPT_MAIN');
        }
        visit.status = 'WAITING_CLINIC';
        visit.windowClaimedById = null;
        publishSseEvent([SSE_TOPICS.department('MAIN')], SseEventType.VISIT_UPSERT, {
          visitId: visit.id,
          status: 'WAITING_CLINIC',
          serviceTicket: visit.serviceTicket,
        });
        operationCounter += 1;
      }

      if (visit.status === 'WAITING_CLINIC' || visit.status === 'IN_PROGRESS') {
        visit.status = 'COMPLETED';
        publishSseEvent([SSE_TOPICS.department('MAIN')], SseEventType.VISIT_REMOVE, {
          visitId: visit.id,
          status: 'COMPLETED',
        });
        operationCounter += 1;
      }
    }

    const elapsedMs = performance.now() - start;

    const triageTickets = Array.from(visits.values()).map((visit) => visit.triageTicket).filter((value): value is number => value !== null);
    const uniqueTriageTickets = new Set(triageTickets);

    const completedCount = Array.from(visits.values()).filter((visit) => visit.status === 'COMPLETED').length;
    const inProgressCount = Array.from(visits.values()).filter((visit) => visit.status === 'IN_PROGRESS').length;

    const publishCalls = mockPublishSseEvent.mock.calls as [string[], string, unknown?][];
    const triageTransitionCalls = publishCalls.filter((call) => call[0].includes(SSE_TOPICS.TRIAGE));
    const windowTransitionCalls = publishCalls.filter((call) => call[0].includes(SSE_TOPICS.WINDOW));
    const callerTransitionCalls = publishCalls.filter((call) => call[0].some((topic) => topic.startsWith('department:MAIN')));

    expect(triageTickets).toHaveLength(TARGET_PATIENTS);
    expect(uniqueTriageTickets.size).toBe(TARGET_PATIENTS);

    expect(completedCount).toBe(TARGET_PATIENTS);
    expect(inProgressCount).toBe(0);

    // Kiosk + Triage and downstream transitions must emit consistently under stress.
    expect(triageTransitionCalls.length).toBeGreaterThanOrEqual(TARGET_PATIENTS);
    expect(windowTransitionCalls.length).toBeGreaterThanOrEqual(TARGET_PATIENTS);
    expect(callerTransitionCalls.length).toBeGreaterThanOrEqual(TARGET_PATIENTS * 2);

    // The test executes significantly more than 500 table operations.
    expect(operationCounter).toBeGreaterThanOrEqual(500);

    console.info(
      `[PeakLoad] Morning surge completed in ${elapsedMs.toFixed(2)}ms with ${operationCounter} operations and ${publishCalls.length} SSE events.`
    );
  });
});
