import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY).",
        },
        { status: 500 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();

    if (listError) {
      return NextResponse.json(
        { error: `Error listing buckets: ${listError.message}` },
        { status: 500 },
      );
    }

    const avatarsBucket = buckets?.find((bucket) => bucket.name === "avatars");

    if (!avatarsBucket) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        "avatars",
        {
          public: true,
          fileSizeLimit: 2097152,
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
        },
      );

      if (createError) {
        return NextResponse.json(
          { error: `Error creating bucket: ${createError.message}` },
          { status: 500 },
        );
      }
    }

    const { error: updateError } = await supabaseAdmin.storage.updateBucket(
      "avatars",
      {
        public: true,
      },
    );

    if (updateError) {
      return NextResponse.json(
        { error: `Error updating bucket policy: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Storage setup error: ${error.message}` },
      { status: 500 },
    );
  }
}
