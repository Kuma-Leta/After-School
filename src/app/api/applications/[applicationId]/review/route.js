import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import { evaluatePostPlacementFeedbackEligibility } from "@/lib/policies/access-control";
import {
  denyWithPolicy,
  requireActorContext,
} from "@/lib/policies/policy-middleware";

const MIN_FEEDBACK_LENGTH = 30;
const MAX_FEEDBACK_LENGTH = 1200;
const EDIT_WINDOW_DAYS = 14;
const MAX_EDIT_COUNT = 2;
const BLOCKED_TERMS = [
  "idiot",
  "stupid",
  "racist",
  "sexist",
  "nude",
  "kill",
  "hate",
  "bitch",
];

function normalizeFeedbackText(value) {
  return (value || "").trim().replace(/\s+/g, " ");
}

function detectBlockedTerms(text) {
  const lowered = text.toLowerCase();
  return BLOCKED_TERMS.filter((term) => lowered.includes(term));
}

function normalizeStrengths(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (item || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function canEditReview(existingReview) {
  const createdAtTs = new Date(existingReview.created_at).getTime();
  const withinWindow =
    Date.now() <= createdAtTs + EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return withinWindow && (existingReview.edit_count || 0) < MAX_EDIT_COUNT;
}

export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const applicationId = params?.applicationId;
    const eligibility = await evaluatePostPlacementFeedbackEligibility({
      supabase,
      actorId: actorContext.actor.id,
      actorProfile: actorContext.profile,
      applicationId,
    });

    if (!eligibility.allowed) {
      return denyWithPolicy(eligibility);
    }

    const adminClient = createServiceRoleClient();
    const { data: review, error: reviewError } = await adminClient
      .from("placement_feedback_reviews")
      .select(
        "id, application_id, rating, feedback_text, strengths, edit_count, created_at, updated_at, last_edited_at",
      )
      .eq("application_id", applicationId)
      .maybeSingle();

    if (reviewError) {
      return NextResponse.json(
        { error: reviewError.message || "Failed to load placement feedback." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      eligible: true,
      canSubmit: !review,
      canEdit: review ? canEditReview(review) : false,
      review,
      policy: {
        enforced: true,
        action: "post_placement_feedback",
        editWindowDays: EDIT_WINDOW_DAYS,
        maxEditCount: MAX_EDIT_COUNT,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load placement feedback." },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const applicationId = params?.applicationId;
    const eligibility = await evaluatePostPlacementFeedbackEligibility({
      supabase,
      actorId: actorContext.actor.id,
      actorProfile: actorContext.profile,
      applicationId,
    });

    if (!eligibility.allowed) {
      return denyWithPolicy(eligibility);
    }

    const body = await request.json().catch(() => ({}));
    const rating = Number(body?.rating);
    const feedbackText = normalizeFeedbackText(body?.feedbackText);
    const strengths = normalizeStrengths(body?.strengths);

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error: "Rating must be an integer between 1 and 5.",
          reason: "invalid_rating",
        },
        { status: 400 },
      );
    }

    if (
      feedbackText.length < MIN_FEEDBACK_LENGTH ||
      feedbackText.length > MAX_FEEDBACK_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Feedback must be between ${MIN_FEEDBACK_LENGTH} and ${MAX_FEEDBACK_LENGTH} characters.`,
          reason: "invalid_feedback_length",
        },
        { status: 400 },
      );
    }

    const blockedTerms = detectBlockedTerms(feedbackText);
    if (blockedTerms.length > 0) {
      return NextResponse.json(
        {
          error:
            "Feedback contains language that violates moderation rules. Please revise before submitting.",
          reason: "unsafe_feedback_language",
          blockedTerms,
        },
        { status: 422 },
      );
    }

    const nowIso = new Date().toISOString();
    const adminClient = createServiceRoleClient();
    const { data: existingReview, error: existingReviewError } =
      await adminClient
        .from("placement_feedback_reviews")
        .select("id, created_at, edit_count")
        .eq("application_id", applicationId)
        .maybeSingle();

    if (existingReviewError) {
      return NextResponse.json(
        {
          error:
            existingReviewError.message ||
            "Failed to verify existing placement feedback.",
        },
        { status: 500 },
      );
    }

    let savedReview;

    if (!existingReview) {
      const { data: inserted, error: insertError } = await adminClient
        .from("placement_feedback_reviews")
        .insert({
          application_id: applicationId,
          job_id: eligibility.job.id,
          employer_id: actorContext.actor.id,
          candidate_id: eligibility.application.applicant_id,
          rating,
          feedback_text: feedbackText,
          strengths,
          edit_count: 0,
          created_at: nowIso,
          updated_at: nowIso,
          last_edited_at: null,
        })
        .select(
          "id, application_id, rating, feedback_text, strengths, edit_count, created_at, updated_at, last_edited_at",
        )
        .single();

      if (insertError) {
        return NextResponse.json(
          {
            error:
              insertError.message || "Failed to submit placement feedback.",
          },
          { status: 500 },
        );
      }

      savedReview = inserted;
    } else {
      if (!canEditReview(existingReview)) {
        return NextResponse.json(
          {
            error:
              "Feedback can no longer be edited. The edit window has closed or max edits were used.",
            reason: "review_edit_locked",
          },
          { status: 409 },
        );
      }

      const nextEditCount = (existingReview.edit_count || 0) + 1;
      const { data: updated, error: updateError } = await adminClient
        .from("placement_feedback_reviews")
        .update({
          rating,
          feedback_text: feedbackText,
          strengths,
          edit_count: nextEditCount,
          updated_at: nowIso,
          last_edited_at: nowIso,
        })
        .eq("id", existingReview.id)
        .select(
          "id, application_id, rating, feedback_text, strengths, edit_count, created_at, updated_at, last_edited_at",
        )
        .single();

      if (updateError) {
        return NextResponse.json(
          {
            error:
              updateError.message || "Failed to update placement feedback.",
          },
          { status: 500 },
        );
      }

      savedReview = updated;
    }

    return NextResponse.json({
      success: true,
      review: savedReview,
      policy: {
        enforced: true,
        action: "post_placement_feedback",
        editWindowDays: EDIT_WINDOW_DAYS,
        maxEditCount: MAX_EDIT_COUNT,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to submit placement feedback." },
      { status: 500 },
    );
  }
}
