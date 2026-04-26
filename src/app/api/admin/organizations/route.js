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

    let organizationsQuery = access.adminClient
      .from("organizations")
      .select(
        "id, org_name, org_type, contact_person, legal_name, registration_number, tax_id, official_email, website, address, authorized_representative_name, authorized_representative_role, verification_status, verification_rejection_reason, documents_submitted_at, verified_at, verified_by, updated_at",
      )
      .in("org_type", ["school", "ngo"])
      .order("updated_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      organizationsQuery = organizationsQuery.eq("verification_status", status);
    }

    const { data: organizations, error: organizationsError } =
      await organizationsQuery;

    if (organizationsError) {
      throw new Error(
        organizationsError.message ||
          "Failed to load organization verifications.",
      );
    }

    const orgIds = (organizations || []).map((organization) => organization.id);

    let profileById = new Map();
    if (orgIds.length > 0) {
      const { data: profiles, error: profileError } = await access.adminClient
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", orgIds);

      if (!profileError) {
        profileById = new Map(
          (profiles || []).map((profile) => [profile.id, profile]),
        );
      }
    }

    let docsByOrgId = new Map();
    if (orgIds.length > 0) {
      const { data: docs, error: docsError } = await access.adminClient
        .from("organization_verification_documents")
        .select(
          "id, organization_id, document_type, storage_bucket, storage_path, original_file_name, content_type, file_size, reviewed_at, created_at",
        )
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false });

      if (!docsError) {
        const docItems = await Promise.all(
          (docs || []).map(async (doc) => {
            const { data: signedData } = await access.adminClient.storage
              .from(doc.storage_bucket)
              .createSignedUrl(doc.storage_path, 3600);

            return {
              ...doc,
              signed_url: signedData?.signedUrl || null,
            };
          }),
        );

        docsByOrgId = docItems.reduce((map, doc) => {
          const current = map.get(doc.organization_id) || [];
          current.push(doc);
          map.set(doc.organization_id, current);
          return map;
        }, new Map());
      }
    }

    const items = (organizations || []).map((organization) => ({
      ...organization,
      profile: profileById.get(organization.id) || null,
      documents: docsByOrgId.get(organization.id) || [],
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load organization verifications." },
      { status: 500 },
    );
  }
}
