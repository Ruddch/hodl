import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { IS_ARCADE_ENABLED } from "@/lib/constants";

export function middleware(request: NextRequest) {
  if (!IS_ARCADE_ENABLED && request.nextUrl.pathname.startsWith("/arcade")) {
    return NextResponse.redirect(new URL("/tournament", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/arcade", "/arcade/:path*"],
};
