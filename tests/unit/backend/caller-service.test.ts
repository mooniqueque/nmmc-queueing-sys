const mockDb = {
  user: { findUnique: jest.fn() },
  department: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn() },
  visit: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), delete: jest.fn() },
  visitStatusHistory: { create: jest.fn() },
  priorityCategory: { create: jest.fn(), createMany: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  sequence: { upsert: jest.fn(), deleteMany: jest.fn() },
  patient: { delete: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock('../../../nmmcqueue-backend/src/config/database.js', () => ({
  db: mockDb,
}));

jest.mock('../../../nmmcqueue-backend/src/lib/claim-retry.js', () => ({
  withClaimConflictRetry: async (work: () => Promise<unknown>) => work(),
}));

jest.mock('../../../nmmcqueue-backend/src/lib/sse.js', () => ({
  publishDepartmentEvent: jest.fn(),
  publishDepartmentMonitorEvent: jest.fn(),
}));

jest.mock('../../../nmmcqueue-backend/src/modules/monitor/service.js', () => ({
  monitorService: {
    getDepartmentStatus: jest.fn(async () => ({ active: [], upcoming: [] })),
  },
}));

import { callerService } from '../../../nmmcqueue-backend/src/modules/caller/service';
import { AppError } from '../../../nmmcqueue-backend/src/middleware/error-handler';

describe('CallerService (Phase 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.user.findUnique.mockResolvedValue({
      id: 'caller-1',
      departmentId: 'dept-1',
      department: null,
      workstationId: 'ws-1',
      workstation: { id: 'ws-1', departmentId: 'dept-1' },
    });
  });

  it('getPendingQueue only returns caller department queue', async () => {
    mockDb.visit.findMany.mockResolvedValue([{ id: 'v1', status: 'WAITING_CLINIC', departmentId: 'dept-1' }]);

    const result = await callerService.getPendingQueue(undefined, 'caller-1');

    expect(result).toHaveLength(1);
    expect(mockDb.visit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ departmentId: 'dept-1' }),
      })
    );
  });

  it('getPendingQueue scopes no-show tickets to the current caller', async () => {
    mockDb.visit.findMany.mockResolvedValue([]);

    await callerService.getPendingQueue(undefined, 'caller-1');

    expect(mockDb.visit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ status: 'NO_SHOW', calledByUserId: 'caller-1' }),
          ]),
        }),
      })
    );
  });

  it('getPendingQueue blocks cross-department access', async () => {
    mockDb.department.findUnique.mockResolvedValue({ id: 'dept-2', name: 'ENT' });

    await expect(callerService.getPendingQueue('ENT', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_FORBIDDEN_SCOPE',
      statusCode: 403,
    });
  });

  it('callNextPatient fails when caller already has IN_PROGRESS claim', async () => {
    mockDb.visit.findFirst.mockResolvedValue({ id: 'active-visit' });

    await expect(callerService.callNextPatient('caller-1')).rejects.toMatchObject({
      code: 'CLAIM_ALREADY_ACTIVE',
      statusCode: 409,
    });
  });

  it('callNextPatient returns null when no waiting patient exists', async () => {
    mockDb.visit.findFirst
      .mockResolvedValueOnce(null) // currentClaim
      .mockResolvedValueOnce(null); // nextVisit

    mockDb.$transaction.mockImplementation(async (work: (tx: typeof mockDb) => Promise<unknown>) => work(mockDb));

    const result = await callerService.callNextPatient('caller-1');

    expect(result).toBeNull();
  });

  it('servePatient blocks completion if status is not IN_PROGRESS', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'WAITING_CLINIC',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
    });

    await expect(callerService.servePatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_INVALID_STATE',
      statusCode: 400,
    });
  });

  it('servePatient blocks other caller from completing claimed patient', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-2',
    });

    await expect(callerService.servePatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_CONFLICT',
      statusCode: 409,
    });
  });

  it('transferPatient blocks transfer to same department', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'WAITING_CLINIC',
      departmentId: 'dept-1',
      calledByUserId: null,
    });

    await expect(callerService.transferPatient('visit-1', 'dept-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_INVALID_STATE',
      statusCode: 400,
    });
  });

  it('transferPatient marks referrals as PRIORITY with target priority option', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
      queueBusinessDay: '2026-04-12',
    });

    mockDb.department.findUnique.mockResolvedValue({ id: 'dept-2' });
    mockDb.sequence.upsert.mockResolvedValue({ value: 42 });
    mockDb.priorityCategory.findMany.mockResolvedValue([
      { id: 'cat-ref', code: 'ER-REF', name: 'ER Referral' },
      { id: 'cat-prio', code: 'PRIO', name: 'Priority' },
    ]);
    mockDb.visit.update.mockResolvedValue({ id: 'visit-1', departmentId: 'dept-2', classification: 'PRIORITY' });
    mockDb.$transaction.mockImplementation(async (work: (tx: typeof mockDb) => Promise<unknown>) => work(mockDb));

    await callerService.transferPatient('visit-1', 'dept-2', 'caller-1');

    expect(mockDb.visit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'visit-1' },
        data: expect.objectContaining({
          departmentId: 'dept-2',
          classification: 'PRIORITY',
          isReferred: true,
          sequenceKey: 'DEPT_dept-2',
          serviceTicket: 42,
          categories: expect.objectContaining({
            upsert: expect.objectContaining({
              create: { categoryId: 'cat-ref' },
            }),
          }),
        }),
      })
    );
  });

  it('restorePatient only restores department no-show tickets', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'NO_SHOW',
      departmentId: 'dept-1',
      sequenceKey: 'WINDOW',
      calledByUserId: 'caller-1',
    });

    await expect(callerService.restorePatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_INVALID_STATE',
      statusCode: 400,
    });
  });

  it('restorePatient blocks restoring no-show owned by another caller', async () => {
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'NO_SHOW',
      departmentId: 'dept-1',
      sequenceKey: 'DEPT_dept-1',
      calledByUserId: 'caller-2',
    });

    await expect(callerService.restorePatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_FORBIDDEN_SCOPE',
      statusCode: 403,
    });
  });

  it('throws AppError when user is missing in scope resolution', async () => {
    mockDb.user.findUnique.mockResolvedValueOnce(null);

    await expect(callerService.getPendingQueue(undefined, 'missing-user')).rejects.toBeInstanceOf(AppError);
  });
});
