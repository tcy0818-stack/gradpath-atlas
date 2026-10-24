import { NextResponse, type NextRequest } from "next/server";
import { routeDecision } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const decision = routeDecision(pathname, signedIn);
  if (decision === "allow") return response;

  const url = request.nextUrl.clone();
  url.search = "";
  if (decision === "to-dashboard") {
    url.pathname = "/dashboard";
  } else if (decision === "to-reset-request") {
    url.pathname = "/forgot-password";
    url.searchParams.set("error", "expired");
  } else {
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
  }
  const redirect = NextResponse.redirect(url);
  // Keep any refreshed session cookies and no-cache headers on the redirect.
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  ["cache-control", "expires", "pragma"].forEach((h) => {
    const v = response.headers.get(h);
    if (v) redirect.headers.set(h, v);
  });
  return redirect;
}

export const config = {
  // Everything except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
