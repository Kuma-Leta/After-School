import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActorContext } from "@/lib/policies/policy-middleware";

export async function GET() {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const actorId = actorContext.actor.id;
    const actorRole = (actorContext.profile?.role || "").toLowerCase();

    if (actorRole !== "school") {
      return NextResponse.json(
        { error: "Only schools can access this endpoint." },
        { status: 403 },
      );
    }

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("organization_id", actorId);

    if (jobsError) {
      return NextResponse.json(
        { error: jobsError.message || "Failed to load school jobs." },
        { status: 500 },
      );
    }

    const jobIds = (jobs || []).map((job) => job.id);
    if (jobIds.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("id, applicant_id, status, job_id, submitted_at")
      .in("job_id", jobIds)
      .in("status", ["shortlisted", "interviewing"])
      .order("submitted_at", { ascending: false });

    if (appError) {
      return NextResponse.json(
        { error: appError.message || "Failed to load applications." },
        { status: 500 },
      );
    }

    const uniqueApplicantIds = Array.from(
      new Set(
        (applications || []).map((app) => app.applicant_id).filter(Boolean),
      ),
    );

    let profiles = [];
    if (uniqueApplicantIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, location")
        .in("id", uniqueApplicantIds);

      if (profileError) {
        return NextResponse.json(
          {
            error: profileError.message || "Failed to load candidate profiles.",
          },
          { status: 500 },
        );
      }

      profiles = profileRows || [];
    }

    const jobMap = new Map((jobs || []).map((job) => [job.id, job]));
    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile]),
    );

    const candidates = (applications || [])
      .map((application) => {
        const profile = profileMap.get(application.applicant_id);
        if (!profile) return null;

        return {
          applicationId: application.id,
          status: application.status,
          submittedAt: application.submitted_at,
          candidateId: profile.id,
          candidateName: profile.full_name,
          candidateRole: profile.role,
          candidateAvatarUrl: profile.avatar_url,
          candidateLocation: profile.location,
          jobId: application.job_id,
          jobTitle: jobMap.get(application.job_id)?.title || "Untitled Job",
        };
      })
      .filter(Boolean);

    return NextResponse.json({ candidates });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load school candidates." },
      { status: 500 },
    );
  }
}
