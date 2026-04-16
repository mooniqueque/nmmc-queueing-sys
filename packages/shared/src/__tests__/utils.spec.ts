import { describe, expect, it } from 'vitest';
import { formatDisplayDate, getDepartmentStatusColor, getVisitStatusColor } from '../utils.js';

describe('shared utils', () => {
  it('formats display dates using the business-friendly locale', () => {
    expect(formatDisplayDate('2026-04-15')).toBe('Wednesday, April 15, 2026');
  });

  it('maps department status values to the expected color classes', () => {
    expect(getDepartmentStatusColor('OPEN')).toBe('bg-emerald-500');
    expect(getDepartmentStatusColor('FULL')).toBe('bg-amber-500');
    expect(getDepartmentStatusColor('CLOSED')).toBe('bg-slate-400');
    expect(getDepartmentStatusColor('UNKNOWN')).toBe('bg-slate-400');
  });

  it('maps visit status values to the expected color classes', () => {
    expect(getVisitStatusColor('WAITING_TRIAGE')).toBe('bg-slate-500');
    expect(getVisitStatusColor('IN_PROGRESS')).toBe('bg-orange-500');
    expect(getVisitStatusColor('COMPLETED')).toBe('bg-emerald-500');
  });
});