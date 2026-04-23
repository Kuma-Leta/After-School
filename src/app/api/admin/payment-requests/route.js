import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";

export async function GET(request) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const status = (
      request.nextUrl.searchParams.get("status") || "pending"
    ).toLowerCase();

    let query = access.adminClient
      .from("payment_upgrade_requests")
      .select(
        "id, user_id, role_snapshot, method, amount, currency, status, tx_ref, proof_url, admin_note, created_at, verified_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: requests, error } = await query;

    if (error) {
      throw new Error(error.message || "Failed to fetch payment requests.");
    }

    const userIds = [
      ...new Set((requests || []).map((row) => row.user_id).filter(Boolean)),
    ];
    let profileById = new Map();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await access.adminClient
        .from("profiles")
        .select("id, full_name, email, role")
        .in("id", userIds);

      if (!profilesError) {
        profileById = new Map(
          (profiles || []).map((profile) => [profile.id, profile]),
        );
      }
    }

    const items = (requests || []).map((row) => ({
      ...row,
      profile: profileById.get(row.user_id) || null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load payment requests." },
      { status: 500 },
    );
  }
}
