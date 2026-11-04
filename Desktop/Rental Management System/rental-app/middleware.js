import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = Boolean(req.auth?.user);
  const isPublic = pathname === "/login" || pathname === "/register" || pathname === "/";

  if (!isAuthed && !isPublic) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return Response.redirect(url);
  }

  // Approvals are the landlord's job — keep tenants out of that screen.
  const landlordOnly = ["/approvals", "/properties", "/units", "/tenants", "/leases"];
  const isTenant = req.auth?.user?.role === "tenant";
  if (isTenant && landlordOnly.includes(pathname)) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return undefined;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.svg|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
