import { beforeEach, describe, expect, it, vi } from 'vitest';
import { triageService } from '../../modules/triage/service.js';

const mockDb = (globalThis as any).__mockDb;

describe('ticket sequence limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.user.findUnique.mockResolvedValue({
      id: 'triage-1',
      workstationId: 'ws-1',
    });
    mockDb.patient.create.mockResolvedValue({
      id: 'patient-1',
      firstName: 'Test',
      lastName: 'Patient',
    });
    mockDb.visit.findFirst.mockResolvedValue(null);
    mockDb.visit.count.mockResolvedValue(0);
    mockDb.visit.create.mockResolvedValue({ id: 'visit-1' });
    mockDb.visit.update.mockResolvedValue({ id: 'visit-1' });
    mockDb.visit.findUnique.mockResolvedValue({
      id: 'visit-1',
      patientId: 'patient-1',
      status: 'WAITING_WINDOW',
      queueBusinessDay: '2026-04-15',
      patient: {
        firstName: 'Test',
        lastName: 'Patient',
      },
    });
    mockDb.priorityCategory.findMany.mockResolvedValue([]);
    mockDb.sequence.upsert.mockResolvedValue({ value: 1000 });
  });

  it('handles a 999-to-1000 sequence transition without breaking the ticket format', async () => {
    const result = await triageService.submitTriageForm(
      {
        isManualEntry: true,
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'F',
        hasFever: false,
        hasCough: false,
        hasColds: false,
        hasRashes: false,
        isInfectious: false,
        hasAppointment: false,
        categoryIds: [],
      },
      undefined,
      'triage-1'
    );

    expect(result).toMatchObject({
      triageTicket: 1000,
      classification: 'REGULAR',
    });
    expect(mockDb.sequence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: '2026-04-15:WINDOW_REGULAR' },
      })
    );
  });
});