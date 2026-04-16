import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ticketService } from '../../modules/tickets/service.js';

const mockDb = (globalThis as any).__mockDb;

describe('ticketService.generateNextTicketNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('scopes the default queue sequence by the business day', async () => {
    mockDb.sequence.upsert.mockResolvedValueOnce({ value: 1 });

    const result = await ticketService.generateNextTicketNumber(mockDb);

    expect(result).toBe(1);
    expect(mockDb.sequence.upsert).toHaveBeenCalledWith({
      where: { name: '2026-04-15:DAILY_QUEUE' },
      update: { value: { increment: 1 } },
      create: { name: '2026-04-15:DAILY_QUEUE', value: 1 },
    });
  });

  it('keeps incrementing past 999 without rollover', async () => {
    mockDb.sequence.upsert.mockResolvedValueOnce({ value: 1000 });

    const result = await ticketService.generateNextTicketNumber(
      mockDb,
      'WINDOW_PRIORITY',
      '2026-04-15'
    );

    expect(result).toBe(1000);
    expect(mockDb.sequence.upsert).toHaveBeenCalledWith({
      where: { name: '2026-04-15:WINDOW_PRIORITY' },
      update: { value: { increment: 1 } },
      create: { name: '2026-04-15:WINDOW_PRIORITY', value: 1 },
    });
  });
});