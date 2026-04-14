import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import { listUsersForAdmin } from "@/features/admin/server/users";

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
    const data = await listUsersForAdmin(access.adminClient, {
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
      search: searchParams.get("search"),
      role: searchParams.get("role"),
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load users." },
      { status: 500 },
    );
  }
}
