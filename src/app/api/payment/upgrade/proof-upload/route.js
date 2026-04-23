import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ELIGIBLE_ROLES = ["teacher", "student"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const bucketName = "payment-proofs";
  const { data: buckets, error: listError } =
    await adminClient.storage.listBuckets();

  if (listError) {
    throw new Error(`Could not inspect storage buckets: ${listError.message}`);
  }

  const exists = (buckets || []).some((bucket) => bucket.name === bucketName);
  if (exists) return bucketName;

  const { error: createError } = await adminClient.storage.createBucket(
    bucketName,
    {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ALLOWED_TYPES,
    },
  );

  if (createError) {
    throw new Error(
      `Could not create payment proof bucket: ${createError.message}`,
    );
  }

  return bucketName;
}

export async function POST(request) {
  try {
    const routeClient = await createClient();
    const {
      data: { user },
      error: userError,
    } = await routeClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await routeClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 },
      );
    }

    if (!ELIGIBLE_ROLES.includes((profile.role || "").toLowerCase())) {
      return NextResponse.json(
        { error: "Only university students and teachers can upload proof." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or WebP images are allowed." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum allowed size is 5MB." },
        { status: 400 },
      );
    }

    const adminClient = createServiceRoleClient();
    const bucket = await ensureBucketExists(adminClient);

    const extension = file.name?.split(".").pop()?.toLowerCase() || "png";
    const safeExt = /^[a-z0-9]+$/.test(extension) ? extension : "png";
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

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

    const { data: publicData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      proofUrl: publicData?.publicUrl,
      proofPath: filePath,
      bucket,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload payment proof." },
      { status: 500 },
    );
  }
}
