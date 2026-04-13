import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { errorHandler } from '../../../nmmcqueue-backend/src/middleware/error-handler';

type TestUser = {
  id: string;
  role: 'ADMIN' | 'TRIAGE_NURSE' | 'WINDOW_CLERK' | 'CLINIC_CALLER';
};

let currentUser: TestUser | null = null;

jest.mock('../../../nmmcqueue-backend/src/modules/monitor/service.js', () => ({
  monitorService: {
    getWindowStatus: jest.fn(),
    getDepartmentStatus: jest.fn(),
    getDepartmentsVideos: jest.fn(),
    updateDepartmentVideo: jest.fn(),
  },
}));

jest.mock('../../../nmmcqueue-backend/src/lib/sse.js', () => ({
  setupSSEConnection: jest.fn((_req: unknown, res: any) => res.status(200).end()),
}));

jest.mock('../../../nmmcqueue-backend/src/modules/auth/session-guard.js', () => ({
  getVerifiedSessionUser: jest.fn(async () => currentUser),
  rejectInvalidSession: (_req: unknown, res: any) =>
    res.status(403).json({ success: false, error: 'Forbidden: account is inactive or no longer authorized.' }),
}));

const { monitorRouter } = require('../../../nmmcqueue-backend/src/modules/monitor/routes');
const { monitorService } = require('../../../nmmcqueue-backend/src/modules/monitor/service');
const { getVerifiedSessionUser } = require('../../../nmmcqueue-backend/src/modules/auth/session-guard');

const mockMonitorService = monitorService as jest.Mocked<typeof monitorService>;
const mockGetVerifiedSessionUser = getVerifiedSessionUser as jest.Mock;

describe('Monitor API Flow Integration (Phase 5)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/monitor', monitorRouter);
  app.use(errorHandler);

  beforeEach(() => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };
    jest.clearAllMocks();
    mockGetVerifiedSessionUser.mockImplementation(async () => currentUser);
  });

  it('serves public windows snapshot', async () => {
    mockMonitorService.getWindowStatus.mockResolvedValue({ active: [], upcoming: [] } as any);

    const response = await request(app).get('/api/monitor/windows');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockMonitorService.getWindowStatus).toHaveBeenCalled();
  });

  it('serves department status by slug', async () => {
    mockMonitorService.getDepartmentStatus.mockResolvedValue({ active: [], upcoming: [] } as any);

    const response = await request(app).get('/api/monitor/department/cardiology');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockMonitorService.getDepartmentStatus).toHaveBeenCalledWith('cardiology');
  });

  it('serves department video listing', async () => {
    mockMonitorService.getDepartmentsVideos.mockResolvedValue([{ id: 'dept-1', videoUrl: '/uploads/videos/a.mp4' }] as any);

    const response = await request(app).get('/api/monitor/departments-videos');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(mockMonitorService.getDepartmentsVideos).toHaveBeenCalled();
  });

  it('rejects upload-video for non-admin role', async () => {
    currentUser = { id: 'caller-1', role: 'CLINIC_CALLER' };

    const response = await request(app).post('/api/monitor/upload-video').send({ departmentId: 'dept-1' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(mockMonitorService.updateDepartmentVideo).not.toHaveBeenCalled();
  });

  it('returns 400 when admin upload request has no file', async () => {
    currentUser = { id: 'admin-1', role: 'ADMIN' };

    const response = await request(app).post('/api/monitor/upload-video').field('departmentId', 'dept-1');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(mockMonitorService.updateDepartmentVideo).not.toHaveBeenCalled();
  });
});
