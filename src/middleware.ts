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
    //protection for admin url to prevent unauthorized users
    if (request.nextUrl.pathname.startsWith("/dashboard")) {

        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }
    return NextResponse.next();

}
export const config = {
    matcher: ["/dashboard/:path*"],
};