import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import { getAdminOverview } from "@/features/admin/server/overview";

export async function GET() {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const data = await getAdminOverview(access.adminClient);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load admin overview." },
      { status: 500 },
    );
  }
}
