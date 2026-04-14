import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import { listSubscriptionsForAdmin } from "@/features/admin/server/subscriptions";

export async function GET(request) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const data = await listSubscriptionsForAdmin(access.adminClient, {
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search"),
      tier: searchParams.get("tier"),
      paymentStatus: searchParams.get("paymentStatus"),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load subscriptions." },
      { status: 500 },
    );
  }
}
