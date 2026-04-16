import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callerService } from '../../modules/caller/service.js';
import { callerController } from '../../modules/caller/controller.js';

const mockDb = (globalThis as any).__mockDb;

describe('callerService.deleteDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps Prisma P2003 into a controlled domain error', async () => {
    mockDb.department.delete.mockRejectedValueOnce({ code: 'P2003' });

    await expect(callerService.deleteDepartment('dept-1')).rejects.toMatchObject({
      code: 'DEPARTMENT_DELETE_HAS_VISITS',
      statusCode: 409,
      message: 'Cannot delete department with active visits.',
    });
  });
});

describe('callerController.deleteDepartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards the controlled message instead of a generic failure', async () => {
    mockDb.department.delete.mockRejectedValueOnce({ code: 'P2003' });

    const req: any = { params: { id: 'dept-1' } };
    const res: any = {};
    const next = vi.fn();

    callerController.deleteDepartment(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      code: 'DEPARTMENT_DELETE_HAS_VISITS',
      statusCode: 409,
    }));
  });
});