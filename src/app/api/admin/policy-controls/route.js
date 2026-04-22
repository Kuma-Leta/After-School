import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/features/admin/server/auth";
import {
  getPolicyControls,
  updatePolicyControls,
} from "@/features/admin/server/policy-controls";

export async function GET() {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const controls = await getPolicyControls(access.adminClient);
    return NextResponse.json({ controls });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load policy controls." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const access = await requireAdminRequest();

    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const body = await request.json().catch(() => ({}));
    const controls = await updatePolicyControls(
      access.adminClient,
      {
        allowCrossCityBrowsing: body?.allowCrossCityBrowsing,
        allowCandidateInitiatedEmployerMessages:
          body?.allowCandidateInitiatedEmployerMessages,
        subscriptionRequiredForEmployerContact:
          body?.subscriptionRequiredForEmployerContact,
      },
      access.user?.id,
    );

    return NextResponse.json({ success: true, controls });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update policy controls." },
      { status: 500 },
    );
  }
}
