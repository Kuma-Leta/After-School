"use client";

import { createClient } from "@supabase/supabase-js";

export async function setupStorageBucket() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing Supabase env vars for storage setup (NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY).",
      );
      return false;
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: buckets, error: listError } =
      await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
      return false;
    }

    const avatarsBucket = buckets?.find((b) => b.name === "avatars");

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
        console.error("Error creating bucket:", createError);
        return false;
      }

      console.log("✅ Created avatars bucket");
    }

    const { error: updateError } = await supabaseAdmin.storage.updateBucket(
      "avatars",
      {
        public: true,
      },
    );

    if (updateError) {
      console.error("Error updating bucket policy:", updateError);
      return false;
    }

    console.log("✅ Storage setup complete");
    return true;
  } catch (error) {
    console.error("❌ Storage setup error:", error);
    return false;
  }
}
