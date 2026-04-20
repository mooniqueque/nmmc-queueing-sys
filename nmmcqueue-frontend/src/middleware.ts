import { NextResponse, type NextRequest } from "next/server";
import { AUTH_GET_VERIFIED_SESSION_URL, hasSessionUser, type SessionLike } from "./lib/config/auth-endpoints";

export default async function middleware(request: NextRequest) {
    let session: SessionLike | null = null;
    try {
        const response = await fetch(AUTH_GET_VERIFIED_SESSION_URL, {
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
            cache: "no-store",
        });
        if (response.ok) {
            const payload: unknown = await response.json();
            if (hasSessionUser(payload)) {
                session = payload;
            }
        }
    } catch (error) {
        console.error("Error fetching session from middleware:", error);
    }

    const path = request.nextUrl.pathname;

    // All routes that require authentication
    const protectedRoutes = ["/admin-dashboard", "/admin-caller", "/admin-releasing", "/admin-departments", "/admin-monitor", "/admin-reports", "/admin-triage", "/manage-releasing", "/releasing", "/caller", "/triage"];
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

    if (isProtectedRoute) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const role = session.user.role;
        if (!role) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Admin-only routes (all /admin-* paths)
        if ((path.startsWith("/admin-") || path.startsWith("/manage-releasing")) && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Triage Nurse routes
        if (path.startsWith("/triage") && role !== "TRIAGE_NURSE") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Window Clerk routes
        if (path.startsWith("/releasing") && role !== "WINDOW_CLERK") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Clinic Caller routes
        if (path.startsWith("/caller") && role !== "CLINIC_CALLER") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Role-based redirection upon login or landing on root
    if (session && (path === "/" || path === "/login")) {
        switch (session.user.role) {
            case "ADMIN":
                return NextResponse.redirect(new URL("/admin-dashboard", request.url));
            case "TRIAGE_NURSE":
                return NextResponse.redirect(new URL("/triage", request.url));
            case "WINDOW_CLERK":
                return NextResponse.redirect(new URL("/releasing", request.url));
            case "CLINIC_CALLER":
                return NextResponse.redirect(new URL("/caller", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/admin-dashboard/:path*", "/admin-caller/:path*", "/admin-releasing/:path*", "/admin-departments/:path*", "/admin-monitor/:path*", "/admin-reports/:path*", "/admin-triage/:path*", "/manage-releasing/:path*", "/releasing/:path*", "/caller/:path*", "/triage/:path*"],
};
