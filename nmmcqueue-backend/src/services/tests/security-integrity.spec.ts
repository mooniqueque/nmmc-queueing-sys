import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireCapability, requireRole } from '../../middleware/rbac.js';
import { callerService } from '../../modules/caller/service.js';
import { triageService } from '../../modules/triage/service.js';
import { publishDepartmentEvent } from '../../lib/sse.js';

const mockDb = (globalThis as any).__mockDb;
const mockGetSession = (globalThis as any).__mockGetSession;

function buildSessionUser(role: string) {
  return {
    id: 'user-1',
    role,
    isActive: true,
    firstName: 'Test',
    lastName: 'User',
    middleName: null,
    suffix: null,
    email: 'test@example.com',
    employeeID: 'EMP-1',
    department: 'TRIAGE',
    departmentId: 'dept-1',
    workstationId: 'ws-1',
    image: null,
    name: 'Test User',
    username: 'test.user',
    displayUsername: 'test.user',
  };
}

function createResponse() {
  const response: any = {};
  response.status = vi.fn(() => response);
  response.json = vi.fn(() => response);
  response.setHeader = vi.fn(() => response);
  response.clearCookie = vi.fn(() => response);
  response.write = vi.fn(() => response);
  response.on = vi.fn(() => response);
  response.flushHeaders = vi.fn(() => response);
  response.writableEnded = false;
  return response;
}

describe('Final logical security audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects KIOSK_USER session from claim/assign capabilities (IDOR boundary)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockDb.user.findUnique.mockResolvedValue(buildSessionUser('KIOSK_USER'));

    const req: any = { headers: {}, query: {}, on: vi.fn() };
    const claimRes = createResponse();
    const assignRes = createResponse();
    const next = vi.fn();

    await requireCapability('CLINIC_MUTATE')(req, claimRes, next);
    await requireCapability('WINDOW_MUTATE')(req, assignRes, next);

    expect(next).not.toHaveBeenCalled();
    expect(claimRes.status).toHaveBeenCalledWith(403);
    expect(assignRes.status).toHaveBeenCalledWith(403);
  });

  it('denies unauthenticated SSE subscription to sensitive topics', async () => {
    const realSse = await vi.importActual<typeof import('../../lib/sse.js')>('../../lib/sse.js');
    mockGetSession.mockResolvedValue(null);

    const req: any = {
      headers: {},
      query: { topic: 'monitor:triage' },
      on: vi.fn(),
    };
    const res = createResponse();

    await realSse.setupSSEConnection(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Authentication Required' });
  });

  it('keeps completeVisit idempotent and avoids duplicate analytics events', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      id: 'caller-1',
      departmentId: 'dept-1',
      department: null,
      workstationId: 'ws-1',
      workstation: { id: 'ws-1', departmentId: 'dept-1' },
    });

    mockDb.visit.findUnique
      .mockResolvedValueOnce({
        id: 'visit-1',
        status: 'IN_PROGRESS',
        departmentId: 'dept-1',
        calledByUserId: 'caller-1',
      })
      .mockResolvedValueOnce({
        id: 'visit-1',
        status: 'COMPLETED',
        departmentId: 'dept-1',
        calledByUserId: 'caller-1',
      });

    mockDb.visit.update.mockResolvedValue({
      id: 'visit-1',
      status: 'COMPLETED',
      departmentId: 'dept-1',
    });

    await callerService.servePatient('visit-1', 'caller-1');

    await expect(callerService.servePatient('visit-1', 'caller-1')).rejects.toMatchObject({
      code: 'CLAIM_INVALID_STATE',
      statusCode: 400,
    });

    expect(publishDepartmentEvent).toHaveBeenCalledTimes(1);
  });

  it('sanitizes XSS payloads before patient records are persisted', async () => {
    mockDb.patient.create.mockResolvedValue({ id: 'patient-1' });
    mockDb.visit.findFirst.mockResolvedValue(null);
    mockDb.priorityCategory.findMany.mockResolvedValue([]);
    mockDb.visit.create.mockResolvedValue({ id: 'visit-1' });
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      patient: { id: 'patient-1' },
      department: null,
      categories: [],
    });

    await triageService.registerKioskPatient({
      firstName: "<script>alert('xss')</script>",
      middleName: '',
      lastName: 'Patient',
      dobMonth: '01',
      dobDay: '10',
      dobYear: '1990',
      gender: 'Female',
      address: 'Sample Address',
      birthPlace: 'Sample Birth Place',
      civilStatus: 'Single',
      hasAppointment: false,
      categoryIds: [],
    });

    const patientCreatePayload = mockDb.patient.create.mock.calls[0][0].data;
    expect(patientCreatePayload.firstName).not.toContain('<');
    expect(patientCreatePayload.firstName).not.toContain('>');
    expect(patientCreatePayload.firstName.toLowerCase()).not.toContain('script');
  });

  it('denies KIOSK_USER from admin-only routes', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockDb.user.findUnique.mockResolvedValue(buildSessionUser('KIOSK_USER'));

    const req: any = { headers: {}, query: {}, on: vi.fn() };
    const res = createResponse();
    const next = vi.fn();

    await requireRole(['ADMIN'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
