const mockDb = {
  department: { findFirst: jest.fn() },
  workStation: { findMany: jest.fn() },
  priorityCategory: { findMany: jest.fn() },
  visit: { findMany: jest.fn() },
};

jest.mock('../../../nmmcqueue-backend/src/config/database.js', () => ({
  db: mockDb,
}));

jest.mock('../../../nmmcqueue-backend/src/lib/queue-business-day.js', () => ({
  getQueueBusinessDay: jest.fn(() => '2026-04-13'),
}));

import { monitorService } from '../../../nmmcqueue-backend/src/modules/monitor/service';

describe('MonitorService.getDepartmentStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.department.findFirst.mockResolvedValue({
      id: 'dept-1',
      name: 'ANIMAL BITE DEPARTMENT',
      code: 'ABD',
    });

    mockDb.priorityCategory.findMany.mockResolvedValue([]);
  });

  it('falls back to the claimed caller workstation when no department-linked caller station exists', async () => {
    mockDb.workStation.findMany.mockResolvedValue([]);
    mockDb.visit.findMany
      .mockResolvedValueOnce([
        {
          calledAtStationId: 'ws-caller-1',
          serviceTicket: 1,
          classification: 'REGULAR',
          calledAt: new Date('2026-04-13T08:30:00.000Z'),
          categories: [],
          calledAtStation: {
            id: 'ws-caller-1',
            name: 'Clinic Desk Alpha',
            stationNo: 1,
            type: 'CALLER',
            isActive: true,
            departmentId: null,
          },
          calledByUser: {
            id: 'caller-1',
            workstation: null,
          },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await monitorService.getDepartmentStatus('dept-1');

    expect(result).toEqual({
      active: [
        expect.objectContaining({
          windowName: 'Clinic Desk Alpha',
          stationNo: 1,
          serviceTicket: 'REG-1',
        }),
      ],
      upcoming: [],
    });
  });

  it('keeps the patient on the exact claimed station when configured lanes also exist', async () => {
    mockDb.workStation.findMany.mockResolvedValue([
      {
        id: 'ws-prio',
        name: 'Priority Lane',
        stationNo: 1,
        type: 'CALLER',
        isActive: true,
        departmentId: 'dept-1',
      },
      {
        id: 'ws-regular',
        name: 'Regular Lane',
        stationNo: 2,
        type: 'CALLER',
        isActive: true,
        departmentId: 'dept-1',
      },
    ]);

    mockDb.visit.findMany
      .mockResolvedValueOnce([
        {
          calledAtStationId: 'ws-regular',
          serviceTicket: 7,
          classification: 'PRIORITY',
          calledAt: new Date('2026-04-13T08:31:00.000Z'),
          categories: [],
          calledAtStation: {
            id: 'ws-regular',
            name: 'Regular Lane',
            stationNo: 2,
            type: 'CALLER',
            isActive: true,
            departmentId: 'dept-1',
          },
          calledByUser: {
            id: 'caller-1',
            workstation: null,
          },
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await monitorService.getDepartmentStatus('dept-1');

    expect(result.active).toEqual([
      expect.objectContaining({
        windowName: 'Priority Lane',
        stationNo: 1,
        serviceTicket: null,
      }),
      expect.objectContaining({
        windowName: 'Regular Lane',
        stationNo: 2,
        serviceTicket: 'PRIO-7',
      }),
    ]);
  });
});
