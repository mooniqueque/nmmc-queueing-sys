import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
    let session = null;
    try {
        const response = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
            headers: {
                cookie: request.headers.get("cookie") || "",
            },
        });
        if (response.ok) {
            session = await response.json();
        }
    } catch (error) {
        console.error("Error fetching session from middleware:", error);
    }

    const path = request.nextUrl.pathname;

    // Protection for dashboard-related routes
    const protectedRoutes = ["/admin-dashboard", "/caller", "/releasing", "/monitor", "/reports", "/triage"];
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

    if (session && session.user.isApproved === false) {
        return NextResponse.redirect(new URL("/login?error=unapproved", request.url));
    }

    if (isProtectedRoute) {
        if (!session) {
            // Redirect unauthenticated users to login if they try to hit a protected route
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Only ADMIN can access /admin
        if (path.startsWith("/admin-dashboard") && session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Only TRIAGE_NURSE or ADMIN can access /triage
        if (path.startsWith("/triage") && session.user.role !== "TRIAGE_NURSE" && session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Role-based redirection upon successful login or landing on the root page
    if (session && (path === "/" || path === "/login")) {
        if (session.user.role === "TRIAGE_NURSE") {
            return NextResponse.redirect(new URL("/triage", request.url));
        }
        if (session.user.role === "ADMIN") {
            return NextResponse.redirect(new URL("/admin-dashboard", request.url));
        }
        // Add more role-based root redirects here if needed (e.g., WINDOW_CLERK)
    }

    return NextResponse.next();
}

export const config = {
    // Mathers including root, login, and protected routes
    matcher: ["/", "/login", "/admin/:path*", "/caller/:path*", "/releasing/:path*", "/monitor/:path*", "/reports/:path*", "/triage/:path*"],
};
