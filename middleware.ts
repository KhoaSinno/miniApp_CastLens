import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Handle CORS for Frame endpoints
  if (
    request.nextUrl.pathname.startsWith("/api/frame") ||
    request.nextUrl.pathname.startsWith("/frame")
  ) {
    const response = NextResponse.next();

    // Add CORS headers for Frame requests
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/frame/:path*", "/frame/:path*"],
};
