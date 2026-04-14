import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import { updateUserByAdmin } from "@/features/admin/server/users";

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
    const data = await updateUserByAdmin(access.adminClient, userId, payload);

    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update user." },
      { status: 500 },
    );
  }
}
