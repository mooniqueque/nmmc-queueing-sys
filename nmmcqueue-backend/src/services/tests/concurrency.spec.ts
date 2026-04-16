import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callerService } from '../../modules/caller/service.js';

const mockDb = (globalThis as any).__mockDb;

describe('callerService.callPatient concurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.user.findUnique.mockResolvedValue({
      id: 'caller-1',
      departmentId: 'dept-1',
      department: null,
      workstationId: 'ws-1',
      workstation: { id: 'ws-1', departmentId: 'dept-1' },
    });

    mockDb.visitStatusHistory.create.mockResolvedValue({});
    mockDb.visit.findUnique.mockImplementation(async () => ({
      id: 'visit-1',
      status: 'WAITING_CLINIC',
      departmentId: 'dept-1',
      calledByUserId: null,
    }));
  });

  it('allows exactly one simultaneous claim to succeed', async () => {
    let claimSucceeded = false;
    let readCount = 0;

    mockDb.visit.updateMany.mockImplementation(async () => {
      if (claimSucceeded) {
        return { count: 0 };
      }

      claimSucceeded = true;
      return { count: 1 };
    });

    mockDb.visit.findUnique.mockImplementation(async () => {
      readCount += 1;
      if (readCount > 5 && claimSucceeded) {
        return {
          id: 'visit-1',
          status: 'IN_PROGRESS',
          departmentId: 'dept-1',
          calledByUserId: 'caller-1',
        };
      }

      return {
        id: 'visit-1',
        status: 'WAITING_CLINIC',
        departmentId: 'dept-1',
        calledByUserId: null,
      };
    });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => callerService.callPatient('visit-1', 'caller-1'))
    );

    const fulfilled = results.filter((result): result is PromiseFulfilledResult<unknown> => result.status === 'fulfilled');
    const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    expect(rejected.every((result) => (result.reason as { code?: string }).code === 'CLAIM_CONFLICT')).toBe(true);
    expect(claimSucceeded).toBe(true);
    expect(mockDb.visit.updateMany).toHaveBeenCalledTimes(5);
  });
});