import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ELIGIBLE_ROLES = ["school", "ngo"];
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET_NAME = "organization-verification-docs";
const ALLOWED_DOCUMENT_TYPES = [
  "license",
  "certificate",
  "authorization_letter",
  "other",
];

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role configuration.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function ensureBucketExists(adminClient) {
  const { data: buckets, error: listError } =
    await adminClient.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not inspect storage buckets: ${listError.message}`);
  }

  const exists = (buckets || []).some((bucket) => bucket.name === BUCKET_NAME);
  if (exists) return BUCKET_NAME;

  const { error: createError } = await adminClient.storage.createBucket(
    BUCKET_NAME,
    {
      public: false,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ALLOWED_TYPES,
    },
  );

  if (createError) {
    throw new Error(
      `Could not create organization verification bucket: ${createError.message}`,
    );
  }

  return BUCKET_NAME;
}

async function requireEligibleOrganizationUser() {
  const routeClient = await createClient();
  const {
    data: { user },
    error: userError,
  } = await routeClient.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
    };
  }

  const { data: profile, error: profileError } = await routeClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      status: 404,
      error: "Profile not found.",
    };
  }

  if (!ELIGIBLE_ROLES.includes((profile.role || "").toLowerCase())) {
    return {
      ok: false,
      status: 403,
      error: "Only school and NGO accounts can upload verification documents.",
    };
  }

  return {
    ok: true,
    user,
  };
}

export async function GET() {
  try {
    const access = await requireEligibleOrganizationUser();
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const adminClient = createServiceRoleClient();

    const { data: docs, error: docsError } = await adminClient
      .from("organization_verification_documents")
      .select(
        "id, document_type, storage_bucket, storage_path, original_file_name, content_type, file_size, reviewed_by, reviewed_at, created_at",
      )
      .eq("organization_id", access.user.id)
      .order("created_at", { ascending: false });

    if (docsError) {
      throw new Error(
        docsError.message || "Failed to load verification documents.",
      );
    }

    const items = await Promise.all(
      (docs || []).map(async (doc) => {
        const { data: signedData } = await adminClient.storage
          .from(doc.storage_bucket)
          .createSignedUrl(doc.storage_path, 3600);

        return {
          ...doc,
          signed_url: signedData?.signedUrl || null,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to load verification documents." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const access = await requireEligibleOrganizationUser();
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = (formData.get("documentType") || "other")
      .toString()
      .toLowerCase()
      .trim();

    if (!ALLOWED_DOCUMENT_TYPES.includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type." },
        { status: 400 },
      );
    }

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, JPG, PNG, and WebP files are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 10MB." },
        { status: 400 },
      );
    }

    const adminClient = createServiceRoleClient();
    const bucket = await ensureBucketExists(adminClient);

    const extension = file.name?.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = /^[a-z0-9]+$/.test(extension) ? extension : "bin";
    const filePath = `${access.user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Upload failed.");
    }

    const { data: insertedDoc, error: insertError } = await adminClient
      .from("organization_verification_documents")
      .insert({
        organization_id: access.user.id,
        document_type: documentType,
        storage_bucket: bucket,
        storage_path: filePath,
        original_file_name: file.name || null,
        content_type: file.type || null,
        file_size: file.size || null,
        uploaded_by: access.user.id,
      })
      .select(
        "id, document_type, storage_bucket, storage_path, original_file_name, content_type, file_size, created_at",
      )
      .single();

    if (insertError || !insertedDoc) {
      throw new Error(
        insertError?.message || "Failed to save uploaded document.",
      );
    }

    await adminClient
      .from("organizations")
      .update({
        documents_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", access.user.id);

    return NextResponse.json({ item: insertedDoc });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload verification document." },
      { status: 500 },
    );
  }
}
