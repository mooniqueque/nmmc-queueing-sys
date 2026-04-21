import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { AppError, errorHandler } from '../../../nmmcqueue-backend/src/middleware/error-handler';
import { getVerifiedSessionUser } from '../../../nmmcqueue-backend/src/modules/auth/session-guard';
import { callerRouter } from '../../../nmmcqueue-backend/src/modules/caller/routes';
import { callerService } from '../../../nmmcqueue-backend/src/modules/caller/service';

type TestUser = {
  id: string;
  role: 'ADMIN' | 'TRIAGE_NURSE' | 'WINDOW_CLERK' | 'CLINIC_CALLER';
};

let currentUser: TestUser | null = null;

jest.mock('../../../nmmcqueue-backend/src/modules/caller/service.js', () => ({
  callerService: {
    getResolvedScope: jest.fn(),
    getDepartments: jest.fn(),
    getPendingQueue: jest.fn(),
    callNextPatient: jest.fn(),
    callPatient: jest.fn(),
    servePatient: jest.fn(),
    noShowPatient: jest.fn(),
    transferPatient: jest.fn(),
    restorePatient: jest.fn(),
    notifyPatient: jest.fn(),
    forceRemoveVisit: jest.fn(),
    createDepartment: jest.fn(),
    deleteDepartment: jest.fn(),
    getQueueOptions: jest.fn(),
    getQueueOptionsByDepartment: jest.fn(),
    createQueueOption: jest.fn(),
    deleteQueueOption: jest.fn(),
  },
}));

jest.mock('../../../nmmcqueue-backend/src/modules/auth/session-guard.js', () => ({
  getVerifiedSessionUser: jest.fn(async () => currentUser),
  rejectInvalidSession: (_req: unknown, res: any) =>
    res.status(403).json({ success: false, error: 'Forbidden: account is inactive or no longer authorized.' }),
}));

const mockCallerService = callerService as jest.Mocked<typeof callerService>;
const mockGetVerifiedSessionUser = getVerifiedSessionUser as jest.Mock;

describe('Caller API Flow Integration (Phase 4.2)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/caller', callerRouter);
  app.use(errorHandler);

  beforeEach(() => {
    currentUser = { id: 'caller-1', role: 'CLINIC_CALLER' };
    jest.clearAllMocks();
    mockGetVerifiedSessionUser.mockImplementation(async () => currentUser);
  });

  it('returns 401 when caller endpoint is accessed without session', async () => {
    currentUser = null;

    const response = await request(app).get('/api/caller/pending');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Authentication Required');
  });

  it('resolves scope and queue using authenticated caller id', async () => {
    mockCallerService.getResolvedScope.mockResolvedValue({
      userId: 'caller-1',
      departmentId: 'dept-1',
      departmentName: 'CARDIOLOGY',
    });
    mockCallerService.getPendingQueue.mockResolvedValue([{ id: 'v-1' }]);

    const scopeResponse = await request(app).get('/api/caller/scope');
    const queueResponse = await request(app).get('/api/caller/pending?departmentName=CARDIOLOGY');

    expect(scopeResponse.status).toBe(200);
    expect(scopeResponse.body.success).toBe(true);
    expect(mockCallerService.getResolvedScope).toHaveBeenCalledWith('caller-1');

    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body.success).toBe(true);
    expect(mockCallerService.getPendingQueue).toHaveBeenCalledWith('CARDIOLOGY', 'caller-1');
  });

  it('rejects call-next for role without CLINIC_MUTATE capability', async () => {
    currentUser = { id: 'triage-1', role: 'TRIAGE_NURSE' };

    const response = await request(app).post('/api/caller/call-next').send({});

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('capability CLINIC_MUTATE is required');
    expect(mockCallerService.callNextPatient).not.toHaveBeenCalled();
  });

  it('calls next patient with overrideClassification when authorized', async () => {
    mockCallerService.callNextPatient.mockResolvedValue({ id: 'visit-next', status: 'IN_PROGRESS' });

    const response = await request(app)
      .post('/api/caller/call-next')
      .send({ overrideClassification: 'PRIORITY' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.callNextPatient).toHaveBeenCalledWith('caller-1', 'PRIORITY', undefined);
  });

  it('calls next priority patient with priorityCategoryKey when provided', async () => {
    mockCallerService.callNextPatient.mockResolvedValue({ id: 'visit-priority', status: 'IN_PROGRESS' });

    const response = await request(app)
      .post('/api/caller/call-next')
      .send({ overrideClassification: 'PRIORITY', priorityCategoryKey: 'PWD' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.callNextPatient).toHaveBeenCalledWith('caller-1', 'PRIORITY', 'PWD');
  });

  it('returns 400 when transfer payload is invalid', async () => {
    const response = await request(app).post('/api/caller/visit/visit-1/transfer').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(String(response.body.message)).toContain('targetDepartmentId');
    expect(mockCallerService.transferPatient).not.toHaveBeenCalled();
  });

  it('propagates service errors through global error handler', async () => {
    mockCallerService.servePatient.mockRejectedValue(
      new AppError('Only the caller who claimed this patient can complete it.', 409, 'CLAIM_CONFLICT')
    );

    const response = await request(app).post('/api/caller/visit/visit-1/serve').send({});

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('CLAIM_CONFLICT');
  });

  it('allows force-remove only for ADMIN role', async () => {
    currentUser = { id: 'caller-1', role: 'CLINIC_CALLER' };

    const forbidden = await request(app).delete('/api/caller/visit/visit-1/force-remove');

    expect(forbidden.status).toBe(403);
    expect(mockCallerService.forceRemoveVisit).not.toHaveBeenCalled();

    currentUser = { id: 'admin-1', role: 'ADMIN' };
    mockCallerService.forceRemoveVisit.mockResolvedValue({ id: 'visit-1', status: 'NO_SHOW' });

    const allowed = await request(app).delete('/api/caller/visit/visit-1/force-remove');

    expect(allowed.status).toBe(200);
    expect(allowed.body.success).toBe(true);
    expect(mockCallerService.forceRemoveVisit).toHaveBeenCalledWith('visit-1', 'admin-1');
  });

  it('calls patient by visit id for authorized caller', async () => {
    mockCallerService.callPatient.mockResolvedValue({ id: 'visit-9', status: 'IN_PROGRESS' });

    const response = await request(app).post('/api/caller/visit/visit-9/call').send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.callPatient).toHaveBeenCalledWith('visit-9', 'caller-1');
  });

  it('marks patient no-show for authorized caller', async () => {
    mockCallerService.noShowPatient.mockResolvedValue({ id: 'visit-3', status: 'NO_SHOW' });

    const response = await request(app).post('/api/caller/visit/visit-3/no-show').send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.noShowPatient).toHaveBeenCalledWith('visit-3', 'caller-1');
  });

  it('restores no-show patient for authorized caller', async () => {
    mockCallerService.restorePatient.mockResolvedValue({ id: 'visit-3', status: 'WAITING_CLINIC' });

    const response = await request(app).post('/api/caller/visit/visit-3/restore').send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.restorePatient).toHaveBeenCalledWith('visit-3', 'caller-1');
  });

  it('notifies patient for authorized caller', async () => {
    mockCallerService.notifyPatient.mockResolvedValue({ success: true, message: 'Notification sent successfully' });

    const response = await request(app).post('/api/caller/visit/visit-3/notify').send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockCallerService.notifyPatient).toHaveBeenCalledWith('visit-3');
  });

  it('rejects invalid call-next overrideClassification payload', async () => {
    const response = await request(app)
      .post('/api/caller/call-next')
      .send({ overrideClassification: 'INVALID' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockCallerService.callNextPatient).not.toHaveBeenCalled();
  });

  it('rejects empty priorityCategoryKey payload', async () => {
    const response = await request(app)
      .post('/api/caller/call-next')
      .send({ overrideClassification: 'PRIORITY', priorityCategoryKey: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockCallerService.callNextPatient).not.toHaveBeenCalled();
  });

  it('allows admin to create and delete departments', async () => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };
    mockCallerService.createDepartment.mockResolvedValue({ id: 'dept-new', name: 'ENT', code: 'ENT' });

    const createResponse = await request(app)
      .post('/api/caller/departments')
      .send({ name: 'ENT', code: 'ENT' });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);
    expect(mockCallerService.createDepartment).toHaveBeenCalledWith('ENT', 'ENT');

    const deleteResponse = await request(app).delete('/api/caller/departments/dept-new');

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(mockCallerService.deleteDepartment).toHaveBeenCalledWith('dept-new');
  });

  it('rejects department management for non-admin roles', async () => {
    currentUser = { id: 'caller-1', role: 'CLINIC_CALLER' };

    const createResponse = await request(app)
      .post('/api/caller/departments')
      .send({ name: 'ENT', code: 'ENT' });

    const deleteResponse = await request(app).delete('/api/caller/departments/dept-new');

    expect(createResponse.status).toBe(403);
    expect(deleteResponse.status).toBe(403);
    expect(mockCallerService.createDepartment).not.toHaveBeenCalled();
    expect(mockCallerService.deleteDepartment).not.toHaveBeenCalled();
  });

  it('allows admin to create and delete queue options', async () => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };
    mockCallerService.createQueueOption.mockResolvedValue({ id: 'opt-1', code: 'PWD', name: 'PWD' });

    const createResponse = await request(app)
      .post('/api/caller/queue-options')
      .send({
        departmentName: 'CARDIOLOGY',
        data: {
          name: 'PWD',
          code: 'PWD',
          isPriority: true,
        },
      });

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.success).toBe(true);
    expect(mockCallerService.createQueueOption).toHaveBeenCalledWith('CARDIOLOGY', {
      name: 'PWD',
      code: 'PWD',
      isPriority: true,
    });

    const deleteResponse = await request(app).delete('/api/caller/queue-options/opt-1');

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(mockCallerService.deleteQueueOption).toHaveBeenCalledWith('opt-1');
  });

  it('rejects invalid queue option payload with validation error', async () => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };

    const response = await request(app)
      .post('/api/caller/queue-options')
      .send({
        departmentName: 'CARDIOLOGY',
        data: {
          name: '',
          code: '',
          isPriority: true,
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockCallerService.createQueueOption).not.toHaveBeenCalled();
  });
});
