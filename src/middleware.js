import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes
  const publicRoutes = ["/", "/login", "/register", "/forgot-password"];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // Protected routes
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");

  // Allow auth callback
  if (isApiAuth) {
    return response;
  }

  // Redirect to login if accessing dashboard without auth
  if (isDashboard && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to appropriate dashboard if logged in and trying to access auth pages
  if (
    isPublicRoute &&
    user &&
    !request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    // Get user role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile) {
      const dashboardPath = `/dashboard/${profile.role}`;
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
