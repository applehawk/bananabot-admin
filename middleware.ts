import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        console.log("Middleware triggered for:", req.nextUrl.pathname);
        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/login",
        },
        callbacks: {
            authorized: ({ token }) => {
                console.log("Middleware authorized check. Token:", !!token);
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth endpoints)
         * - login (login page)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    ],
};
