import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireCapability, requireRole } from '../rbac.js';

const mockDb = (globalThis as any).__mockDb;
const mockGetSession = (globalThis as any).__mockGetSession;

function createResponse() {
  const response: any = {};
  response.status = vi.fn(() => response);
  response.json = vi.fn(() => response);
  return response;
}

describe('rbac privilege escalation defenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies TRIAGE_NURSE access to clinic mutation capabilities', async () => {
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
  });

  it('denies TRIAGE_NURSE access to admin-only mutation routes', async () => {
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

    await requireRole(['ADMIN'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Forbidden: role TRIAGE_NURSE lacks permission',
    });
  });
});