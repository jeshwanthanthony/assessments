import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie on page navigation and sends signed-out visitors to /login.
// API routes authenticate themselves (requireUser) and answer 401 as JSON.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  // Local signature check of the session token (no round trip to Supabase Auth on every page load).
  const { data: claims } = await sb.auth.getClaims();
  const data = { user: claims?.claims?.sub ? { id: claims.claims.sub } : null };
  const isLogin = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";
  if (!data.user && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  // ?add=1 lets a signed-in person add another account (the current one moves to the switcher).
  if (data.user && isLogin && !request.nextUrl.searchParams.has("add")) return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|fonts|logo.svg|favicon.ico).*)"],
};
