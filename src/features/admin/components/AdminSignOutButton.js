"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminSignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      Logout
    </button>
  );
}
