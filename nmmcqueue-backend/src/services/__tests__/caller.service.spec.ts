import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callerService } from '../../modules/caller/service.js';

const mockDb = (globalThis as any).__mockDb;

describe('callerService.callPatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.user.findUnique.mockResolvedValue({
      id: 'caller-1',
      departmentId: 'dept-1',
      department: null,
      workstationId: 'ws-1',
      workstation: { id: 'ws-1', departmentId: 'dept-1' },
    });
  });

  it('rejects claims when the visit is already IN_PROGRESS under another caller', async () => {
    mockDb.visit.findUnique.mockResolvedValueOnce({
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-2',
    });

    await expect(callerService.callPatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_CONFLICT',
      statusCode: 409,
    });
  });

  it('refreshes the claim when the same caller re-calls an already IN_PROGRESS visit', async () => {
    const updatedVisit = {
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
      calledAt: new Date('2026-04-15T10:15:00.000Z'),
    };

    mockDb.visit.findUnique.mockResolvedValueOnce({
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
    }).mockResolvedValueOnce(updatedVisit);
    mockDb.visit.update.mockResolvedValueOnce(updatedVisit);

    const result = await callerService.callPatient('visit-1', 'caller-1');

    expect(result).toEqual(updatedVisit);
    expect(mockDb.visit.update).toHaveBeenCalledWith({
      where: { id: 'visit-1' },
      data: {
        calledAt: expect.any(Date),
      },
    });
  });

  it('blocks re-calling a completed visit', async () => {
    mockDb.visit.findUnique.mockResolvedValueOnce({
      id: 'visit-1',
      status: 'COMPLETED',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
    });

    await expect(callerService.callPatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_INVALID_STATE',
      statusCode: 400,
    });
  });
});

describe('callerService.transferPatient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.user.findUnique.mockResolvedValue({
      id: 'caller-1',
      departmentId: 'dept-1',
      department: null,
      workstationId: 'ws-1',
      workstation: { id: 'ws-1', departmentId: 'dept-1' },
    });
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      status: 'IN_PROGRESS',
      departmentId: 'dept-1',
      calledByUserId: 'caller-1',
      queueBusinessDay: '2026-04-15',
    });
    mockDb.department.findUnique.mockResolvedValue({
      id: 'dept-2',
      name: 'Radiology',
      status: 'CLOSED',
    });
  });

  it('rejects transferring to a closed department', async () => {
    await expect(callerService.transferPatient('visit-1', 'dept-2', 'caller-1')).rejects.toMatchObject({
      code: 'DEPARTMENT_ASSIGNMENT_BLOCKED',
      statusCode: 409,
    });
  });
});