import { getQueueBusinessDay, getBusinessTimeZone } from '../../../nmmcqueue-backend/src/lib/queue-business-day';

describe('Queue Business Day Utility', () => {
  describe('getQueueBusinessDay', () => {
    it('should return a date string in YYYY-MM-DD format', () => {
      const result = getQueueBusinessDay();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return consistent format across multiple calls on same day', () => {
      const result1 = getQueueBusinessDay();
      const result2 = getQueueBusinessDay();
      expect(result1).toBe(result2);
    });

    it('should handle timezone conversion correctly for Manila timezone', () => {
      // Test with a specific date: 2026-04-15 00:30 UTC (which is 2026-04-15 08:30 in Manila)
      const utcDate = new Date('2026-04-15T00:30:00Z');
      const result = getQueueBusinessDay(utcDate);
      expect(result).toBe('2026-04-15');
    });

    it('should handle dates before midnight UTC (early morning Manila time)', () => {
      // 2026-04-14 20:00 UTC = 2026-04-15 04:00 Manila time
      const utcDate = new Date('2026-04-14T20:00:00Z');
      const result = getQueueBusinessDay(utcDate);
      expect(result).toBe('2026-04-15');
    });

    it('should handle dates near midnight', () => {
      // Test near midnight Manila time
      const utcDate = new Date('2026-04-14T16:00:00Z');
      const result = getQueueBusinessDay(utcDate);
      expect(result).toBe('2026-04-15');
    });
  });

  describe('getBusinessTimeZone', () => {
    it('should return Asia/Manila timezone', () => {
      const result = getBusinessTimeZone();
      expect(result).toBe('Asia/Manila');
    });
  });
});
