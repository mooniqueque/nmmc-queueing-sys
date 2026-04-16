import { vi } from 'vitest';

const mockDb = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userDepartmentAccess: {
    findMany: vi.fn(),
  },
  department: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  visit: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  patient: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  priorityCategory: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  queueOptionTemplate: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  visitStatusHistory: {
    create: vi.fn(),
  },
  sequence: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  workstation: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(async (work: (tx: typeof mockDb) => Promise<unknown>) => work(mockDb as never)),
};

const mockGetSession = vi.fn();
const mockFromNodeHeaders = vi.fn(() => new Headers());
const mockPublishSseEvent = vi.fn();
const mockPublishDepartmentEvent = vi.fn();
const mockPublishDepartmentMonitorEvent = vi.fn();
const mockPublishDepartmentStatusUpdate = vi.fn();
const mockEmitQueueUpdate = vi.fn();
const mockGetWindowStatus = vi.fn(async () => ({ active: [], upcoming: [] }));
const mockGetDepartmentStatus = vi.fn(async () => ({ active: [], upcoming: [] }));
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

(globalThis as any).__mockDb = mockDb;
(globalThis as any).__mockGetSession = mockGetSession;
(globalThis as any).__mockPublishSseEvent = mockPublishSseEvent;

vi.mock('./nmmcqueue-backend/src/config/database.js', () => ({
  db: mockDb,
}));

vi.mock('./nmmcqueue-backend/src/modules/auth/auth.js', () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: mockFromNodeHeaders,
}));

vi.mock('./nmmcqueue-backend/src/lib/logger.js', () => ({
  default: mockLogger,
}));

vi.mock('./nmmcqueue-backend/src/lib/claim-retry.js', () => ({
  withClaimConflictRetry: vi.fn(async (work: () => Promise<unknown>) => work()),
}));

vi.mock('./nmmcqueue-backend/src/lib/queue-business-day.js', () => ({
  getQueueBusinessDay: vi.fn(() => '2026-04-15'),
  getBusinessTimeZone: vi.fn(() => 'Asia/Manila'),
}));

vi.mock('./nmmcqueue-backend/src/lib/sse.js', () => ({
  SSE_TOPICS: {
    TRIAGE: 'triage',
    WINDOW: 'window',
    MONITOR_WINDOWS: 'monitor:windows',
    department: (alias: string) => `department:${alias.trim().toUpperCase()}`,
    monitorDepartment: (alias: string) => `monitor:department:${alias.trim().toUpperCase()}`,
  },
  SseEventType: {
    CONNECTED: 'connected',
    VISIT_UPSERT: 'visit-upsert',
    VISIT_REMOVE: 'visit-remove',
    QUEUE_INVALIDATED: 'queue-invalidated',
    DEPARTMENT_STATUS_UPDATED: 'department-status-updated',
    MONITOR_SNAPSHOT: 'monitor-snapshot',
    MONITOR_UPSERT: 'monitor-upsert',
    MONITOR_REMOVE: 'monitor-remove',
    MONITOR_UPCOMING: 'monitor-upcoming',
  },
  publishSseEvent: mockPublishSseEvent,
  publishDepartmentEvent: mockPublishDepartmentEvent,
  publishDepartmentMonitorEvent: mockPublishDepartmentMonitorEvent,
  publishDepartmentStatusUpdate: mockPublishDepartmentStatusUpdate,
  emitQueueUpdate: mockEmitQueueUpdate,
  getDepartmentTopicAliases: vi.fn(async () => []),
  setupSSEConnection: vi.fn(),
}));

vi.mock('./nmmcqueue-backend/src/modules/monitor/service.js', () => ({
  monitorService: {
    getWindowStatus: mockGetWindowStatus,
    getDepartmentStatus: mockGetDepartmentStatus,
  },
}));

vi.mock('./nmmcqueue-backend/src/services/ticket-printing-service.js', () => ({
  ticketPrintingService: {
    print: vi.fn(),
    printPayload: vi.fn(),
  },
}));
