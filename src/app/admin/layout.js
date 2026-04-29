import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSignOutButton from "@/features/admin/components/AdminSignOutButton";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser = user;

  if (!currentUser) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    currentUser = session?.user ?? null;
  }

  if (!currentUser) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if ((profile?.role || "").toLowerCase() !== "admin") {
    redirect("/dashboard");
  }
}

export default async function AdminLayout({ children }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
            <p className="text-sm text-gray-600">
              Dedicated management area for users and subscriptions.
            </p>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Overview
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Users
            </Link>
            <Link
              href="/admin/subscriptions"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Subscriptions
            </Link>
            <Link
              href="/dashboard/pricing"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Pricing
            </Link>
            <Link
              href="/admin/organizations"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Organizations
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
            >
              Settings
            </Link>
            <AdminSignOutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
