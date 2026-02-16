import { createFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";

interface Session {
    user: {
        id: string;
        email: string;
        role: string;
    };
    session: {
        token: string;
        expiresAt: Date;
    }
}


export default async function middleware(request: NextRequest) {
    const fetch = createFetch();
    //get session 
    const { data: session } = await fetch<Session>(
        "/api/auth/get-session",
        {
            baseURL: request.nextUrl.origin,
            headers: {
                //get cookie
                cookie: request.headers.get("cookie") || "",
            },
        }
    );
    // Protection for dashboard-related routes
    const protectedRoutes = ["/admin", "/caller", "/releasing", "/monitor", "/reports"];
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    if (isProtectedRoute) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Only ADMIN can access /admin
        if (request.nextUrl.pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/caller/:path*", "/releasing/:path*", "/monitor/:path*", "/reports/:path*"],
};