const STATIC_FRONTEND_HOSTS = [
    "172.50.254.20",
    "172.50.254.21",
    "172.50.254.22",
    "172.50.254.23",
    "172.50.254.24",
    "localhost",
    "127.0.0.1",
] as const;

const STATIC_FRONTEND_HOST_SET = new Set<string>(STATIC_FRONTEND_HOSTS);

function normalizeOrigin(origin: string): string {
    return origin.replace(/\/+$/, "");
}

export function buildTrustedOrigins(frontendUrl = process.env.FRONTEND_URL): string[] {
    const trustedOrigins = new Set<string>();
    const frontendOrigin = frontendUrl?.trim() || "http://localhost:3000";

    trustedOrigins.add(normalizeOrigin(frontendOrigin));

    for (const host of STATIC_FRONTEND_HOSTS) {
        for (const protocol of ["http", "https"] as const) {
            trustedOrigins.add(`${protocol}://${host}`);
            trustedOrigins.add(`${protocol}://${host}:3000`);
        }
    }

    return Array.from(trustedOrigins);
}

export function isAllowedFrontendOrigin(
    origin: string | undefined,
    trustedOrigins: ReadonlySet<string>,
): boolean {
    if (!origin) {
        return true;
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (trustedOrigins.has(normalizedOrigin)) {
        return true;
    }

    try {
        const { hostname } = new URL(normalizedOrigin);
        return STATIC_FRONTEND_HOST_SET.has(hostname);
    } catch {
        return false;
    }
}
