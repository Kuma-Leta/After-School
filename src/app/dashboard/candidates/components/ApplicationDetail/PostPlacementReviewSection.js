"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_FORM = {
  rating: 0,
  feedbackText: "",
  strengths: [],
};

const STRENGTH_OPTIONS = [
  "Reliability",
  "Communication",
  "Punctuality",
  "Subject mastery",
  "Professionalism",
  "Initiative",
];

export default function PostPlacementReviewSection({ application }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewState, setReviewState] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const applicationId = application?.id;
  const isHired = application?.status === "hired";

  const feedbackLength = useMemo(() => form.feedbackText.trim().length, [form]);

  useEffect(() => {
    let active = true;

    async function loadReview() {
      if (!applicationId || !isHired) {
        setReviewState(null);
        setForm(DEFAULT_FORM);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `/api/applications/${applicationId}/review`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            payload?.error || "Failed to load placement feedback.",
          );
        }

        if (!active) return;

        setReviewState(payload);
        if (payload?.review) {
          setForm({
            rating: payload.review.rating || 0,
            feedbackText: payload.review.feedback_text || "",
            strengths: payload.review.strengths || [],
          });
        } else {
          setForm(DEFAULT_FORM);
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || "Failed to load placement feedback.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReview();

    return () => {
      active = false;
    };
  }, [applicationId, isHired]);

  const canEdit = Boolean(reviewState?.canEdit || reviewState?.canSubmit);

  const toggleStrength = (value) => {
    setForm((previous) => {
      const exists = previous.strengths.includes(value);
      if (exists) {
        return {
          ...previous,
          strengths: previous.strengths.filter((item) => item !== value),
        };
      }

      if (previous.strengths.length >= 5) {
        return previous;
      }

      return {
        ...previous,
        strengths: [...previous.strengths, value],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/review`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to save placement feedback.");
      }

      setSuccess(reviewState?.review ? "Review updated." : "Review submitted.");
      setReviewState((previous) => ({
        ...(previous || {}),
        review: payload.review,
        canSubmit: false,
        canEdit: Boolean(previous?.canEdit),
      }));
    } catch (saveError) {
      setError(saveError.message || "Failed to save placement feedback.");
    } finally {
      setSaving(false);
    }
  };

  if (!isHired) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-gray-900">
          Post-placement feedback
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          You can submit a rating and review after this application reaches
          hired status.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
        Loading post-placement feedback...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Post-placement feedback
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Share factual, respectful feedback. Abusive language is blocked and
          edits are limited.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Rating</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={!canEdit || saving}
              onClick={() =>
                setForm((previous) => ({ ...previous, rating: star }))
              }
              className={`text-2xl transition ${
                form.rating >= star ? "text-amber-500" : "text-gray-300"
              } ${!canEdit ? "cursor-not-allowed" : "hover:scale-110"}`}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">
          Strength tags (up to 5)
        </p>
        <div className="flex flex-wrap gap-2">
          {STRENGTH_OPTIONS.map((tag) => {
            const selected = form.strengths.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={!canEdit || saving}
                onClick={() => toggleStrength(tag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  selected
                    ? "border-green-300 bg-green-50 text-green-800"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Written feedback
        </label>
        <textarea
          value={form.feedbackText}
          disabled={!canEdit || saving}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              feedbackText: event.target.value,
            }))
          }
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#FF1E00] focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/20 disabled:bg-gray-100"
          placeholder="Describe how the placement went, what worked well, and what could improve."
        />
        <p className="mt-1 text-xs text-gray-500">
          {feedbackLength}/1200 characters (min 30)
        </p>
      </div>

      {!canEdit && reviewState?.review && (
        <p className="text-xs text-amber-700">
          Editing is locked after the review window or once max edits are used.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canEdit}
        className="rounded-lg bg-[#FF1E00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#E01B00] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving
          ? "Saving..."
          : reviewState?.review
            ? "Update feedback"
            : "Submit feedback"}
      </button>
    </div>
  );
}
