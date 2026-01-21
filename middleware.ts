import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/pricing",
    "/sign-in(.*)",
    "/sign-up(.*)",
]);

const isDashboardRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/documents(.*)",
    "/templates(.*)",
    "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    if (userId && isPublicRoute(req) && !req.nextUrl.pathname.startsWith("/sign")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!userId && isDashboardRoute(req)) {
        return NextResponse.redirect(new URL("/sign-in", req.url));
    }
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
