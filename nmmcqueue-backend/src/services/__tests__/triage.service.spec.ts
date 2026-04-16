import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triageService } from '../../modules/triage/service.js';

const mockDb = (globalThis as any).__mockDb;

describe('triageService.submitTriageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects assigning a closed department during triage submission', async () => {
    mockDb.department.findUnique.mockResolvedValueOnce({
      id: 'dept-closed',
      name: 'Radiology',
      status: 'CLOSED',
    });

    await expect(
      triageService.submitTriageForm(
        {
          isManualEntry: false,
          hasFever: false,
          hasCough: false,
          hasColds: false,
          hasRashes: false,
          isInfectious: false,
          hasAppointment: false,
          departmentId: 'dept-closed',
          categoryIds: [],
        },
        undefined,
        'triage-user-1'
      )
    ).rejects.toMatchObject({
      code: 'DEPARTMENT_ASSIGNMENT_BLOCKED',
      statusCode: 409,
    });

    expect(mockDb.department.findUnique).toHaveBeenCalledWith({
      where: { id: 'dept-closed' },
      select: { id: true, name: true, status: true },
    });
  });
});