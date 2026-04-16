import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireCapability } from '../rbac.js';

const mockDb = (globalThis as any).__mockDb;
const mockGetSession = (globalThis as any).__mockGetSession;

function createResponse() {
  const response: any = {};
  response.status = vi.fn(() => response);
  response.json = vi.fn(() => response);
  response.setHeader = vi.fn(() => response);
  response.clearCookie = vi.fn(() => response);
  return response;
}

describe('requireCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows ADMIN users through the capability gate', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'admin-session' } });
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: 'admin-session',
      role: 'ADMIN',
      isActive: true,
      firstName: 'Ada',
      lastName: 'Admin',
      middleName: null,
      suffix: null,
      email: 'admin@example.com',
      employeeID: 'EMP-1',
      department: 'ADMIN',
      departmentId: null,
      workstationId: null,
      image: null,
      name: 'Ada Admin',
      username: 'admin',
      displayUsername: 'admin',
    });

    const req: any = { headers: {}, query: {}, on: vi.fn() };
    const res = createResponse();
    const next = vi.fn();

    await requireCapability('CLINIC_MUTATE')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects TRIAGE users for clinic mutation capability', async () => {
    mockGetSession.mockResolvedValueOnce({ user: { id: 'triage-session' } });
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: 'triage-session',
      role: 'TRIAGE_NURSE',
      isActive: true,
      firstName: 'Tina',
      lastName: 'Triage',
      middleName: null,
      suffix: null,
      email: 'triage@example.com',
      employeeID: 'EMP-2',
      department: 'TRIAGE',
      departmentId: 'dept-1',
      workstationId: 'ws-1',
      image: null,
      name: 'Tina Triage',
      username: 'triage',
      displayUsername: 'triage',
    });

    const req: any = { headers: {}, query: {}, on: vi.fn() };
    const res = createResponse();
    const next = vi.fn();

    await requireCapability('CLINIC_MUTATE')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Forbidden: capability CLINIC_MUTATE is required.',
    });
  });
});