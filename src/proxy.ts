import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/auth-edge";

// First line of defence for pages; every API handler re-checks authorization itself.
export async function proxy(req: NextRequest) {
  const s = await verifySession(req.cookies.get(COOKIE)?.value);
  const { pathname } = req.nextUrl;
  const login = () => NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url));
  if (!s) return login();
  const isAdmin = s.role === "admin" || !!s.adminId;
  if (pathname.startsWith("/admin") && !isAdmin) return NextResponse.redirect(new URL("/", req.url));
  if (pathname.startsWith("/operator") && !(isAdmin || s.role === "operator")) return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/operator/:path*", "/account"] };
