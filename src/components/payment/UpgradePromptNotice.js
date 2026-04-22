"use client";

import { useRouter } from "next/navigation";

const DEFAULT_BENEFITS = [
  "Your profile is visible to employers with priority highlighting.",
  "Unlimited job applications without trial restrictions.",
  "Faster employer response through premium candidate placement.",
  "Early access to new job opportunities.",
];

export default function UpgradePromptNotice({
  title = "Upgrade to Premium",
  description,
  triggerLabel,
  redirectTo = "/",
  benefits = DEFAULT_BENEFITS,
  onDismiss,
}) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push(`/payment?redirect=${encodeURIComponent(redirectTo)}`);
  };

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {triggerLabel && (
            <p className="text-xs font-medium mt-1 uppercase tracking-wide text-amber-700">
              Trigger: {triggerLabel}
            </p>
          )}
          {description && <p className="text-sm mt-2">{description}</p>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm font-semibold text-amber-800 hover:text-amber-950"
          >
            Dismiss
          </button>
        )}
      </div>

      <div className="mt-3">
        <p className="text-sm font-semibold">Paid benefits</p>
        <ul className="mt-2 space-y-1 text-sm">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-700" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleUpgrade}
          className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Upgrade now
        </button>
        <span className="text-xs text-amber-700">
          You can continue browsing, but premium actions stay locked until
          upgrade.
        </span>
      </div>
    </div>
  );
}
