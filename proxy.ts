import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
    "/trending",
    "/history",
    "/topic",
    "/blog-preview",
];

export async function proxy(req: NextRequest): Promise<NextResponse> {
    const { pathname } = req.nextUrl;

    const isProtected = PROTECTED_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isProtected) {
        return NextResponse.next();
    }

    /* Check JWT session cookie */
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/trending/:path*",
        "/history/:path*",
        "/topic/:path*",
        "/blog-preview/:path*",
    ],
};
