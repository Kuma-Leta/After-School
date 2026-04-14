import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import { updateSubscriptionByAdmin } from "@/features/admin/server/subscriptions";

export async function PATCH(request, context) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const { userId } = await context.params;
    const payload = await request.json();
    const item = await updateSubscriptionByAdmin(
      access.adminClient,
      userId,
      payload,
    );

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update subscription." },
      { status: 500 },
    );
  }
}
