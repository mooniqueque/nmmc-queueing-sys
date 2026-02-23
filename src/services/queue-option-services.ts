import { promises as fs } from "fs";
import path from "path";

export const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"] as const;

const queueOptionStorePath = path.join(process.cwd(), "src", "lib", "constants", "queue-options.json");

type QueueOptionStore = {
    byDepartment: Record<string, string[]>;
    legacyGlobalOptions: string[];
};

type PersistedQueueOptionStore = {
    byDepartment?: unknown;
    legacyGlobalOptions?: unknown;
    initialized?: unknown;
    options?: unknown;
};

function normalizeOption(value: string) {
    return value.trim().toUpperCase();
}

function normalizeDepartmentKey(value: string) {
    return value.trim().toUpperCase();
}

function isDefaultOption(value: string): value is (typeof DEFAULT_QUEUE_OPTIONS)[number] {
    return DEFAULT_QUEUE_OPTIONS.includes(value as (typeof DEFAULT_QUEUE_OPTIONS)[number]);
}

function orderOptions(values: string[]) {
    const unique = sanitizeOptions(values);
    const defaultsInOrder = DEFAULT_QUEUE_OPTIONS.filter((option) => unique.includes(option));
    const custom = unique
        .filter((option) => !isDefaultOption(option))
        .sort((left, right) => left.localeCompare(right));

    return [...defaultsInOrder, ...custom];
}

function sanitizeOptions(values: string[]) {
    return Array.from(
        new Set(
            values
                .map((value) => normalizeOption(value))
                .filter((value) => value.length > 0)
        )
    );
}

async function readStoredOptions(): Promise<QueueOptionStore> {
    try {
        const raw = await fs.readFile(queueOptionStorePath, "utf8");
        const parsed = JSON.parse(raw) as unknown;

        if (Array.isArray(parsed)) {
            return {
                byDepartment: {},
                legacyGlobalOptions: orderOptions(
                    parsed.filter((value): value is string => typeof value === "string")
                )
            };
        }

        if (!parsed || typeof parsed !== "object") {
            return { byDepartment: {}, legacyGlobalOptions: [] };
        }

        const objectStore = parsed as PersistedQueueOptionStore;

        const legacyGlobalOptions = Array.isArray(objectStore.legacyGlobalOptions)
            ? orderOptions(objectStore.legacyGlobalOptions.filter((value): value is string => typeof value === "string"))
            : Array.isArray(objectStore.options)
                ? orderOptions(objectStore.options.filter((value): value is string => typeof value === "string"))
                : [];

        const byDepartmentRaw = objectStore.byDepartment;
        const byDepartmentEntries = byDepartmentRaw && typeof byDepartmentRaw === "object"
            ? Object.entries(byDepartmentRaw as Record<string, unknown>)
            : [];

        const byDepartment = Object.fromEntries(
            byDepartmentEntries.map(([departmentKey, options]) => {
                const normalizedDepartmentKey = normalizeDepartmentKey(departmentKey);
                const normalizedOptions = Array.isArray(options)
                    ? orderOptions(options.filter((value): value is string => typeof value === "string"))
                    : [];

                return [normalizedDepartmentKey, normalizedOptions];
            })
        );

        return {
            byDepartment,
            legacyGlobalOptions
        };
    } catch {
        return { byDepartment: {}, legacyGlobalOptions: [] };
    }
}

async function writeStoredOptions(store: QueueOptionStore) {
    await fs.writeFile(queueOptionStorePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function getEffectiveOptionsForDepartment(store: QueueOptionStore, departmentName: string) {
    const normalizedDepartmentKey = normalizeDepartmentKey(departmentName);
    const departmentOptions = store.byDepartment[normalizedDepartmentKey];

    if (departmentOptions) {
        return [...departmentOptions];
    }

    const baseline = store.legacyGlobalOptions.length > 0
        ? [...DEFAULT_QUEUE_OPTIONS, ...store.legacyGlobalOptions]
        : [...DEFAULT_QUEUE_OPTIONS];

    return orderOptions(baseline);
}

async function saveDepartmentOptions(departmentName: string, options: string[]) {
    const store = await readStoredOptions();
    const normalizedDepartmentKey = normalizeDepartmentKey(departmentName);

    await writeStoredOptions({
        ...store,
        byDepartment: {
            ...store.byDepartment,
            [normalizedDepartmentKey]: orderOptions(options)
        }
    });
}

export async function getQueueOptions(departmentName: string) {
    const stored = await readStoredOptions();
    return getEffectiveOptionsForDepartment(stored, departmentName);
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    const stored = await readStoredOptions();

    return Object.fromEntries(
        departmentNames.map((departmentName) => [
            normalizeDepartmentKey(departmentName),
            getEffectiveOptionsForDepartment(stored, departmentName)
        ])
    );
}

export async function addQueueOption(departmentName: string, option: string) {
    const normalized = normalizeOption(option);

    if (!normalized) {
        return { success: false, error: "Queue option cannot be empty." };
    }

    const stored = await readStoredOptions();
    const effectiveOptions = getEffectiveOptionsForDepartment(stored, departmentName);

    if (effectiveOptions.includes(normalized)) {
        return { success: false, error: "Queue option already exists." };
    }

    const merged = orderOptions([...effectiveOptions, normalized]);
    await saveDepartmentOptions(departmentName, merged);

    return { success: true };
}

export async function removeQueueOption(departmentName: string, option: string) {
    const normalized = normalizeOption(option);

    if (!normalized) {
        return { success: false, error: "Queue option cannot be empty." };
    }

    const stored = await readStoredOptions();
    const effectiveOptions = getEffectiveOptionsForDepartment(stored, departmentName);
    const next = effectiveOptions.filter((value) => value !== normalized);

    if (next.length === effectiveOptions.length) {
        return { success: false, error: "Queue option not found." };
    }

    await saveDepartmentOptions(departmentName, next);

    return { success: true };
}
