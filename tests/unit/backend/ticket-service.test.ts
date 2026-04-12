import { ticketService } from '../../../nmmcqueue-backend/src/modules/tickets/service';

describe('Ticket Service', () => {
  describe('generateNextTicketNumber', () => {
    let mockTx: any;

    beforeEach(() => {
      mockTx = {
        sequence: {
          upsert: jest.fn(),
        },
      };
    });

    it('should generate ticket numbers sequentially', async () => {
      // First call returns 1
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 1 });
      const ticket1 = await ticketService.generateNextTicketNumber(mockTx);
      expect(ticket1).toBe(1);

      // Second call returns 2
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 2 });
      const ticket2 = await ticketService.generateNextTicketNumber(mockTx);
      expect(ticket2).toBe(2);
    });

    it('should use a default sequence key of DAILY_QUEUE', async () => {
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 1 });
      await ticketService.generateNextTicketNumber(mockTx);

      expect(mockTx.sequence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.stringContaining('DAILY_QUEUE'),
          }),
        })
      );
    });

    it('should use custom sequence key when provided', async () => {
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 15 });
      await ticketService.generateNextTicketNumber(mockTx, 'WINDOW');

      const callArgs = mockTx.sequence.upsert.mock.calls[0][0];
      expect(callArgs.where.name).toContain('WINDOW');
    });

    it('should scope sequence key by queue business day', async () => {
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 1 });
      const testDay = '2026-04-15';
      await ticketService.generateNextTicketNumber(mockTx, 'TEST_SEQ', testDay);

      const callArgs = mockTx.sequence.upsert.mock.calls[0][0];
      expect(callArgs.where.name).toBe('2026-04-15:TEST_SEQ');
    });

    it('should create sequence record if it does not exist', async () => {
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 1 });
      await ticketService.generateNextTicketNumber(mockTx, 'NEW_SEQ', '2026-04-15');

      const callArgs = mockTx.sequence.upsert.mock.calls[0][0];
      expect(callArgs.create).toEqual({
        name: '2026-04-15:NEW_SEQ',
        value: 1,
      });
    });

    it('should increment existing sequence value', async () => {
      mockTx.sequence.upsert.mockResolvedValueOnce({ value: 42 });
      await ticketService.generateNextTicketNumber(mockTx, 'EXISTING', '2026-04-15');

      const callArgs = mockTx.sequence.upsert.mock.calls[0][0];
      expect(callArgs.update).toEqual({
        value: { increment: 1 },
      });
    });
  });
});
