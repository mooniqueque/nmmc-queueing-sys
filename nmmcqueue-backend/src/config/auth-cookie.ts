type SameSitePolicy = "lax" | "strict" | "none";

function parseBoolean(value: string | undefined): boolean | undefined {
    if (!value) return undefined;

    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;

    return undefined;
}

function parseSameSite(value: string | undefined): SameSitePolicy | undefined {
    if (!value) return undefined;

    const normalized = value.trim().toLowerCase();
    if (normalized === "lax" || normalized === "strict" || normalized === "none") {
        return normalized;
    }

    return undefined;
}

function isHttpsUrl(value: string | undefined): boolean {
    if (!value) return false;

    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

const inferredSecureCookie =
    isHttpsUrl(process.env.BACKEND_URL) || isHttpsUrl(process.env.BETTER_AUTH_URL);

export const authCookieSecure =
    parseBoolean(process.env.AUTH_COOKIE_SECURE) ?? inferredSecureCookie;

export const authCookieHttpOnly =
    parseBoolean(process.env.AUTH_COOKIE_HTTP_ONLY) ?? true;

export const authCookieSameSite =
    parseSameSite(process.env.AUTH_COOKIE_SAME_SITE) ?? "lax";
