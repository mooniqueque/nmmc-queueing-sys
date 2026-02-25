import { db } from "@/lib/database/prisma";

export const DEFAULT_QUEUE_OPTIONS = ["REGULAR", "CHILD", "ER-REF", "FT", "REFERRALS"] as const;

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

function getEffectiveOptionsForDepartment(storedOptions: string[]) {
    if (storedOptions.length > 0) {
        return orderOptions(storedOptions);
    }

    return [...DEFAULT_QUEUE_OPTIONS];
}

async function replaceDepartmentOptions(departmentId: string, options: string[]) {
    const next = orderOptions(options);

    await db.$transaction(async (tx) => {
        await tx.laneOption.deleteMany({
            where: { departmentId }
        });

        if (next.length > 0) {
            await tx.laneOption.createMany({
                data: next.map((option) => ({
                    departmentId,
                    option
                })),
                skipDuplicates: true
            });
        }
    });
}

export async function getQueueOptions(departmentName: string) {
    const department = await db.department.findUnique({
        where: { name: departmentName.trim() },
        select: {
            queueOptions: {
                select: { option: true }
            }
        }
    });

    const storedOptions = department
        ? department.queueOptions.map((item) => normalizeOption(item.option))
        : [];

    return getEffectiveOptionsForDepartment(storedOptions);
}

export async function getQueueOptionsByDepartment(departmentNames: string[]) {
    const trimmedDepartmentNames = Array.from(
        new Set(departmentNames.map((departmentName) => departmentName.trim()).filter((departmentName) => departmentName.length > 0))
    );

    const departments = await db.department.findMany({
        where: {
            name: {
                in: trimmedDepartmentNames
            }
        },
        select: {
            name: true,
            queueOptions: {
                select: { option: true }
            }
        }
    });

    const optionsByNormalizedDepartmentKey = Object.fromEntries(
        departments.map((department) => [
            normalizeDepartmentKey(department.name),
            getEffectiveOptionsForDepartment(
                department.queueOptions.map((item) => normalizeOption(item.option))
            )
        ])
    );

    return Object.fromEntries(
        trimmedDepartmentNames.map((departmentName) => {
            const key = normalizeDepartmentKey(departmentName);
            return [
                key,
                optionsByNormalizedDepartmentKey[key] ?? [...DEFAULT_QUEUE_OPTIONS]
            ];
        })
    );
}

export async function addQueueOption(departmentName: string, option: string) {
    const normalized = normalizeOption(option);

    if (!normalized) {
        return { success: false, error: "Queue option cannot be empty." };
    }

    const department = await db.department.findUnique({
        where: { name: departmentName.trim() },
        select: {
            id: true,
            queueOptions: {
                select: { option: true }
            }
        }
    });

    if (!department) {
        return { success: false, error: "Department not found." };
    }

    const effectiveOptions = getEffectiveOptionsForDepartment(
        department.queueOptions.map((item) => normalizeOption(item.option))
    );

    if (effectiveOptions.includes(normalized)) {
        return { success: false, error: "Queue option already exists." };
    }

    const merged = orderOptions([...effectiveOptions, normalized]);
    await replaceDepartmentOptions(department.id, merged);

    return { success: true };
}

export async function removeQueueOption(departmentName: string, option: string) {
    const normalized = normalizeOption(option);

    if (!normalized) {
        return { success: false, error: "Queue option cannot be empty." };
    }

    const department = await db.department.findUnique({
        where: { name: departmentName.trim() },
        select: {
            id: true,
            queueOptions: {
                select: { option: true }
            }
        }
    });

    if (!department) {
        return { success: false, error: "Department not found." };
    }

    const effectiveOptions = getEffectiveOptionsForDepartment(
        department.queueOptions.map((item) => normalizeOption(item.option))
    );
    const next = effectiveOptions.filter((value) => value !== normalized);

    if (next.length === effectiveOptions.length) {
        return { success: false, error: "Queue option not found." };
    }

    await replaceDepartmentOptions(department.id, next);

    return { success: true };
}
