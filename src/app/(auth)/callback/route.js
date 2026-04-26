// src/app/(auth)/callback/route.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  const getSafeNext = (value) => {
    if (!value || !value.startsWith("/")) return null;
    return value;
  };

  let defaultRedirect = "/jobs";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => cookieStore.set(name, value, options),
          remove: (name, options) =>
            cookieStore.set(name, "", { ...options, maxAge: 0 }),
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if ((profile?.role || "").toLowerCase() === "admin") {
        defaultRedirect = "/admin";
      }
    }
  }

  return NextResponse.redirect(
    new URL(getSafeNext(next) || defaultRedirect, requestUrl.origin),
  );
}
