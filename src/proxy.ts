import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const guestId = request.cookies.get("guest-id");

  if (!guestId) {
    // Use Web Crypto API for zero-dependency ID generation
    const newId = crypto.randomUUID();

    response.cookies.set("guest-id", newId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year persistence
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets and internal Next.js files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
