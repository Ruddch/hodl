import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && request.nextUrl.pathname.startsWith("/arcade")) {
    return NextResponse.redirect(new URL("/tournament", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/arcade", "/arcade/:path*"],
};
