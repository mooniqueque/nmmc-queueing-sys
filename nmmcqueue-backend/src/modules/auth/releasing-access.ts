const RELEASING_ACCESS_PREFIX = "__RELEASING_ACCESS__";

export interface ReleasingAccessEntry {
    departmentId: string;
    enabled: boolean;
}

export interface ReleasingAccessConfig {
    version: 1;
    departments: ReleasingAccessEntry[];
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeEntries(entries: unknown): ReleasingAccessEntry[] {
    if (!Array.isArray(entries)) return [];

    const deduped = new Map<string, boolean>();
    for (const entry of entries) {
        if (!isObject(entry)) continue;

        const departmentId = typeof entry.departmentId === 'string' ? entry.departmentId.trim() : '';
        if (!departmentId) continue;

        const enabled = entry.enabled !== false;
        deduped.set(departmentId, enabled);
    }

    return Array.from(deduped.entries()).map(([departmentId, enabled]) => ({
        departmentId,
        enabled,
    }));
}

export function parseReleasingAccess(rawDepartmentValue?: string | null): ReleasingAccessEntry[] {
    if (!rawDepartmentValue || !rawDepartmentValue.startsWith(RELEASING_ACCESS_PREFIX)) {
        return [];
    }

    const payload = rawDepartmentValue.slice(RELEASING_ACCESS_PREFIX.length);
    if (!payload) return [];

    try {
        const parsed = JSON.parse(payload) as unknown;
        if (!isObject(parsed) || !Array.isArray(parsed.departments)) {
            return [];
        }

        return normalizeEntries(parsed.departments);
    } catch {
        return [];
    }
}

export function buildReleasingAccess(entries: ReleasingAccessEntry[]): string {
    const normalized = normalizeEntries(entries);
    const config: ReleasingAccessConfig = {
        version: 1,
        departments: normalized,
    };

    return `${RELEASING_ACCESS_PREFIX}${JSON.stringify(config)}`;
}