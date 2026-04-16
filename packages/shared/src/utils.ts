const departmentStatusColors = {
  OPEN: 'bg-emerald-500',
  FULL: 'bg-amber-500',
  CLOSED: 'bg-slate-400',
} as const;

const visitStatusColors = {
  WAITING_TRIAGE: 'bg-slate-500',
  IN_TRIAGE: 'bg-amber-500',
  WAITING_WINDOW: 'bg-blue-500',
  IN_WINDOW: 'bg-indigo-500',
  WAITING_CLINIC: 'bg-cyan-500',
  IN_PROGRESS: 'bg-orange-500',
  COMPLETED: 'bg-emerald-500',
  NO_SHOW: 'bg-rose-500',
} as const;

export function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDepartmentStatusColor(status: keyof typeof departmentStatusColors | string) {
  return departmentStatusColors[status as keyof typeof departmentStatusColors] ?? departmentStatusColors.CLOSED;
}

export function getVisitStatusColor(status: keyof typeof visitStatusColors | string) {
  return visitStatusColors[status as keyof typeof visitStatusColors] ?? visitStatusColors.WAITING_TRIAGE;
}