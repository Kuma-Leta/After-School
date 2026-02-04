// utils/storageSetup.js
import { supabase } from "@/lib/supabase/client";

export async function setupStorageBucket() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarsBucket = buckets?.find((b) => b.name === "avatars");

    if (!avatarsBucket) {
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(
        "avatars",
        {
          public: true,
          fileSizeLimit: 2097152, // 2MB
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

      // Set public access policy
      const { error: policyError } = await supabase
        .from("storage.buckets")
        .update({ public: true })
        .eq("name", "avatars");

      if (policyError) {
        console.error("Error setting bucket policy:", policyError);
        return false;
      }

      console.log("✅ Created avatars bucket");
    }

    // Create RLS policies if they don't exist
    const policies = [
      {
        name: "Public read access",
        policy: `
          CREATE POLICY "Public read access"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'avatars');
        `,
      },
      {
        name: "Authenticated insert access",
        policy: `
          CREATE POLICY "Authenticated insert access"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'avatars');
        `,
      },
      {
        name: "Users update own files",
        policy: `
          CREATE POLICY "Users update own files"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = 'avatars');
        `,
      },
      {
        name: "Users delete own files",
        policy: `
          CREATE POLICY "Users delete own files"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = 'avatars');
        `,
      },
    ];

    console.log("✅ Storage setup complete");
    return true;
  } catch (error) {
    console.error("❌ Storage setup error:", error);
    return false;
  }
}
