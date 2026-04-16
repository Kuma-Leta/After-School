import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function getSafeRedirectTarget(request) {
  const redirect = request.nextUrl.searchParams.get("redirect");
  if (!redirect || !redirect.startsWith("/")) return null;
  return redirect;
}

export async function middleware(request) {
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  const path = request.nextUrl.pathname;

  // Public routes (no auth required)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/callback",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/api/auth",
    "/api/webhooks",
  ];
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
  const isApiRoute = path.startsWith("/api/");

  // Public routes: allow, but redirect if logged in user visits auth pages
  if (isApiRoute || isPublicRoute) {
    if (
      user &&
      ["/login", "/register", "/forgot-password", "/reset-password"].includes(
        path,
      )
    ) {
      const target = getSafeRedirectTarget(request) || "/dashboard";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // --- Protected routes: require login ---
  if (!user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set(
      "redirect",
      `${path}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // --- Admin route protection: block non-admins with 403 (no redirect loop) ---
  if (path.startsWith("/admin")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role?.toLowerCase() !== "admin") {
        console.warn(`Forbidden: ${user.email} tried to access /admin`);
        return new NextResponse("Forbidden – Admin access required", {
          status: 403,
        });
      }
    } catch (err) {
      console.error("Admin check error:", err);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  // --- Redirect admins from /dashboard to /admin (optional, but safe) ---
  if (path.startsWith("/dashboard") && user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role?.toLowerCase() === "admin") {
        console.log(`Admin on /dashboard → redirect to /admin`);
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch (err) {
      // ignore – just let them see dashboard
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|auth).*)"],
};
