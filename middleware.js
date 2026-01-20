// middleware.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next();

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Update request cookies for the current request
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          // Update request cookies for the current request
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          // Update response cookies
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  // IMPORTANT: Refresh session if expired - required for Server Components
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("Middleware - Session:", session?.user?.email);
  console.log("Middleware - Path:", request.nextUrl.pathname);

  // Public routes (no auth required)
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/api/auth",
    "/api/webhooks",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  // Check if it's an API route
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Allow API routes and public routes to pass through
  if (isApiRoute || isPublicRoute) {
    // If user is logged in and trying to access login/register, redirect to dashboard
    if (
      session?.user &&
      ["/login", "/register", "/forgot-password", "/reset-password"].includes(
        request.nextUrl.pathname,
      )
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Check if user is authenticated
  const user = session?.user;

  // Protected routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin");

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    console.log("Middleware - No user, redirecting to login");
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user exists and is trying to access auth pages, redirect to dashboard
  if (
    user &&
    ["/login", "/register", "/forgot-password", "/reset-password"].includes(
      request.nextUrl.pathname,
    )
  ) {
    console.log(
      "Middleware - User logged in, redirecting from auth page to dashboard",
    );
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin route protection
  if (request.nextUrl.pathname.startsWith("/admin") && user) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Middleware - Profile fetch error:", profileError);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (profile?.role !== "admin") {
        console.log("Middleware - Non-admin trying to access admin area");
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      console.error("Middleware - Admin check error:", error);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback routes
     */
    "/((?!_next/static|_next/image|favicon.ico|public|auth).*)",
  ],
};
