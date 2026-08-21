import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth.config";

// Uses the lightweight, Edge-compatible auth config only (no bcrypt/Prisma),
// since middleware always runs on the Edge Runtime.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/setup", "/api/setup-owner"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fine-grained module/action authorization is enforced by requirePermission()
  // inside every Server Action and API route (see lib/permissions.ts) — this
  // middleware only gates authentication, not per-module access, since routes
  // are named by module (/dashboard/patients, /dashboard/billing, ...) rather
  // than by role.
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico)).*)"],
};
