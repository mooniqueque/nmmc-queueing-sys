import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { errorHandler } from '../../../nmmcqueue-backend/src/middleware/error-handler';

type TestUser = {
  id: string;
  role: 'ADMIN' | 'TRIAGE_NURSE' | 'WINDOW_CLERK' | 'CLINIC_CALLER';
};

let currentUser: TestUser | null = null;

const mockDb = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  department: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  userDepartmentAccess: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAuth = {
  api: {
    signUpEmail: jest.fn(),
  },
};

jest.mock('../../../nmmcqueue-backend/src/config/database.js', () => ({
  db: mockDb,
}));

jest.mock('better-auth/node', () => ({
  toNodeHandler: jest.fn(() => (_req: unknown, _res: unknown) => undefined),
}));

jest.mock('../../../nmmcqueue-backend/src/modules/auth/auth.js', () => ({
  auth: mockAuth,
}));

jest.mock('../../../nmmcqueue-backend/src/modules/auth/session-guard.js', () => ({
  getVerifiedSessionUser: jest.fn(async () => currentUser),
  rejectInvalidSession: (_req: unknown, res: any) =>
    res.status(403).json({ success: false, error: 'Forbidden: account is inactive or no longer authorized.' }),
}));

const { userRouter } = require('../../../nmmcqueue-backend/src/modules/auth/routes');
const { db } = require('../../../nmmcqueue-backend/src/config/database');
const { auth } = require('../../../nmmcqueue-backend/src/modules/auth/auth');
const { getVerifiedSessionUser } = require('../../../nmmcqueue-backend/src/modules/auth/session-guard');

const mockDbClient = db as jest.Mocked<typeof db>;
const mockAuthApi = auth as jest.Mocked<typeof auth>;
const mockGetVerifiedSessionUser = getVerifiedSessionUser as jest.Mock;

describe('Admin User API Flow Integration (Phase 5)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/users', userRouter);
  app.use(errorHandler);

  beforeEach(() => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };
    jest.clearAllMocks();
    mockGetVerifiedSessionUser.mockImplementation(async () => currentUser);
  });

  it('returns 401 when users endpoint is accessed without session', async () => {
    currentUser = null;

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('returns 403 when non-admin accesses users endpoint', async () => {
    currentUser = { id: 'caller-1', role: 'CLINIC_CALLER' };

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('lists users for admin role', async () => {
    mockDbClient.user.findMany.mockResolvedValue([{ id: 'u-1', email: 'user@nmmc.local' }] as any);

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockDbClient.user.findMany).toHaveBeenCalled();
  });

  it('rejects invalid admin user creation payload', async () => {
    const response = await request(app)
      .post('/api/users/create')
      .send({
        email: 'not-an-email',
        name: '',
        employeeID: '',
        role: 'ADMIN',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockAuthApi.api.signUpEmail).not.toHaveBeenCalled();
  });

  it('creates a user as admin', async () => {
    mockDbClient.department.findUnique.mockResolvedValue({ id: 'dept-1' } as any);
    mockAuthApi.api.signUpEmail.mockResolvedValue({ user: { id: 'u-new' } } as any);

    const response = await request(app)
      .post('/api/users/create')
      .send({
        email: 'new.user@nmmc.local',
        name: 'New User',
        employeeID: 'EMP-100',
        role: 'CLINIC_CALLER',
        department: 'CARDIOLOGY',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockDbClient.department.findUnique).toHaveBeenCalledWith({
      where: { name: 'CARDIOLOGY' },
    });
    expect(mockAuthApi.api.signUpEmail).toHaveBeenCalled();
  });

  it('updates role and status for admin operations', async () => {
    mockDbClient.user.update.mockResolvedValue({ id: 'u-1' } as any);

    const roleResponse = await request(app)
      .put('/api/users/u-1/role')
      .send({ role: 'TRIAGE_NURSE' });

    const statusResponse = await request(app)
      .put('/api/users/u-1/status')
      .send({ status: false });

    expect(roleResponse.status).toBe(200);
    expect(statusResponse.status).toBe(200);
    expect(mockDbClient.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'u-1' },
      data: { role: 'TRIAGE_NURSE' },
    });
    expect(mockDbClient.user.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'u-1' },
      data: { isActive: false },
    });
  });

  it('rejects invalid role/status payloads', async () => {
    const roleResponse = await request(app)
      .put('/api/users/u-1/role')
      .send({ role: 'INVALID_ROLE' });

    const statusResponse = await request(app)
      .put('/api/users/u-1/status')
      .send({ status: 'false' });

    expect(roleResponse.status).toBe(400);
    expect(statusResponse.status).toBe(400);
    expect(mockDbClient.user.update).not.toHaveBeenCalled();
  });
});
