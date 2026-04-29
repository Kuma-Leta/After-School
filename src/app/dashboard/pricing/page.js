import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    cycle: "forever",
    description: "Good for exploring jobs and basic profile visibility.",
    features: [
      "Create and manage your profile",
      "Browse available jobs",
      "Apply to a limited number of listings",
      "Basic messaging support",
    ],
    ctaLabel: "Current Default",
    ctaHref: "/dashboard",
  },
  {
    name: "Pro",
    price: "$10",
    cycle: "per month",
    description: "Best for active candidates and teams hiring regularly.",
    features: [
      "Unlimited job applications",
      "Priority profile placement",
      "Advanced messaging and follow-up",
      "Faster support response",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/dashboard/subscription",
    highlighted: true,
  },
  {
    name: "Organization",
    price: "Custom",
    cycle: "pricing",
    description: "For schools, NGOs, and families with recurring hiring.",
    features: [
      "Multi-seat hiring workflows",
      "Candidate shortlisting tools",
      "Shared inbox and team access",
      "Dedicated onboarding support",
    ],
    ctaLabel: "Contact Support",
    ctaHref: "mailto:support@afterschool.et",
  },
];

export default function DashboardPricingPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F1F1F]">Pricing</h1>
        <p className="mt-2 text-gray-600">
          Choose a plan that matches your hiring or job-seeking activity.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border bg-white p-6 shadow-sm ${
              plan.highlighted
                ? "border-[#FF1E00] ring-2 ring-[#FF1E00]/15"
                : "border-gray-200"
            }`}
          >
            {plan.highlighted && (
              <span className="mb-4 inline-flex rounded-full bg-[#FF1E00]/10 px-3 py-1 text-xs font-semibold text-[#FF1E00]">
                Most Popular
              </span>
            )}
            <h2 className="text-xl font-semibold text-[#1F1F1F]">
              {plan.name}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{plan.description}</p>

            <div className="mt-5">
              <p className="text-3xl font-bold text-[#1F1F1F]">{plan.price}</p>
              <p className="text-sm text-gray-500">{plan.cycle}</p>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#FF1E00]">●</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.ctaHref}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                plan.highlighted
                  ? "bg-[#FF1E00] text-white hover:bg-[#E01B00]"
                  : "border border-gray-300 bg-white text-[#1F1F1F] hover:bg-gray-50"
              }`}
            >
              {plan.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
