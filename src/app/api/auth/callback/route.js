import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
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

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(
    new URL(getSafeNext(next) || defaultRedirect, requestUrl.origin),
  );
}
