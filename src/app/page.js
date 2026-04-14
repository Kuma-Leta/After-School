// app/page.js
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  MapPin,
  MessageSquareMore,
  School,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default async function Home() {
  // Check if user is logged in to show appropriate CTAs
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  const audienceCards = [
    {
      title: "Teachers",
      description:
        "Discover verified opportunities that match your subjects, level, and location.",
      icon: GraduationCap,
    },
    {
      title: "Schools",
      description:
        "Recruit qualified educators faster with clearer profiles and smoother screening.",
      icon: School,
    },
    {
      title: "University Students",
      description:
        "Find part-time tutoring and teaching work that fits your schedule.",
      icon: BookOpen,
    },
    {
      title: "Families",
      description:
        "Connect with trusted private tutors for home support and exam preparation.",
      icon: Users,
    },
  ];

  const highlights = [
    "Verified educator profiles and clearer role matching",
    "Messaging and application flow built for fast follow-up",
    "Designed around Ethiopia's education and hiring context",
  ];

  const featurePoints = [
    {
      title: "Smarter Matching",
      description:
        "Reduce noise and surface educators by subject, experience, and availability.",
      icon: Sparkles,
    },
    {
      title: "Local-First Hiring",
      description:
        "Built for schools, NGOs, tutors, and families working across Ethiopia.",
      icon: MapPin,
    },
    {
      title: "Secure Communication",
      description:
        "Keep outreach, follow-up, and hiring conversations in one place.",
      icon: MessageSquareMore,
    },
    {
      title: "Trusted Profiles",
      description:
        "Present experience, qualifications, and intent in a format employers can review quickly.",
      icon: ShieldCheck,
    },
  ];

  const steps = [
    {
      title: "Create a standout profile",
      description:
        "Share subjects, qualifications, experience, and the type of opportunity you want.",
    },
    {
      title: "Discover strong-fit matches",
      description:
        "Browse roles or candidates with less friction and more useful context.",
    },
    {
      title: "Connect and move quickly",
      description:
        "Apply, message, review, and hire through one streamlined workflow.",
    },
  ];

  const testimonials = [
    {
      quote:
        "I found a teaching role in less than two weeks, and the profile setup made it easy to show my strengths.",
      name: "Abel T.",
      role: "Mathematics Teacher",
    },
    {
      quote:
        "We filled three urgent openings faster because candidate profiles were clearer and easier to compare.",
      name: "Bright Future School",
      role: "School Administrator",
    },
    {
      quote:
        "The platform made private tutoring feel more trustworthy for our family and much easier to arrange.",
      name: "Rahel G.",
      role: "Parent",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,30,0,0.16),_transparent_28%),linear-gradient(180deg,#fff7f3_0%,#ffffff_40%,#fff9f5_100%)] text-[#1F1F1F]">
      <div className="landing-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="landing-orb left-[-140px] top-24" />
      <div className="landing-orb right-[-120px] top-[560px]" />

      <nav className="relative z-10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-white/70 bg-white/75 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5A36] shadow-[0_16px_40px_rgba(255,90,54,0.35)]">
              <span className="text-lg font-black tracking-tight text-white">
                AS
              </span>
            </div>
            <div>
              <p className="text-lg font-black tracking-tight sm:text-xl">
                After<span className="text-[#FF5A36]">School</span>
              </p>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#6B7280]">
                Ethiopia education network
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-[#1F1F1F]/10 bg-[#1F1F1F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold text-[#1F1F1F] transition hover:bg-black/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,90,54,0.34)] transition hover:bg-[#E94724]"
                >
                  Join Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FF5A36]/20 bg-white/80 px-4 py-2 text-sm font-semibold text-[#C63E21] shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Built for teachers, schools, and families in Ethiopia
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-[#171717] sm:text-6xl lg:text-7xl lg:leading-[1.02]">
                The hiring platform that makes education opportunities feel
                alive.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[#52525B] sm:text-lg">
                Find teaching jobs, recruit qualified educators, and connect
                with trusted tutors through a platform designed to move from
                discovery to placement with less friction.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {!isLoggedIn ? (
                  <>
                    <Link
                      href="/register?role=teacher"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5A36] px-7 py-4 text-base font-bold text-white shadow-[0_20px_40px_rgba(255,90,54,0.35)] transition hover:translate-y-[-1px] hover:bg-[#E94724]"
                    >
                      Start as a Teacher
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/register?role=school"
                      className="inline-flex items-center justify-center rounded-full border border-[#1F1F1F]/10 bg-white px-7 py-4 text-base font-bold text-[#1F1F1F] shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition hover:border-[#FF5A36]/30 hover:text-[#C63E21]"
                    >
                      Hire Qualified Talent
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5A36] px-7 py-4 text-base font-bold text-white shadow-[0_20px_40px_rgba(255,90,54,0.35)] transition hover:translate-y-[-1px] hover:bg-[#E94724]"
                  >
                    Open Your Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
              </div>

              <ul className="mt-8 grid gap-3 text-sm text-[#4B5563] sm:grid-cols-3 sm:text-base">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/70 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#FF5A36]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="landing-panel rounded-[28px] p-5">
                  <dt className="text-sm font-semibold uppercase tracking-[0.18em] text-[#737373]">
                    Educators
                  </dt>
                  <dd className="mt-2 text-4xl font-black tracking-tight text-[#171717]">
                    500+
                  </dd>
                  <p className="mt-2 text-sm text-[#52525B]">
                    Verified profiles across subjects and grade levels.
                  </p>
                </div>
                <div className="landing-panel rounded-[28px] p-5">
                  <dt className="text-sm font-semibold uppercase tracking-[0.18em] text-[#737373]">
                    Hiring Partners
                  </dt>
                  <dd className="mt-2 text-4xl font-black tracking-tight text-[#171717]">
                    150+
                  </dd>
                  <p className="mt-2 text-sm text-[#52525B]">
                    Schools, NGOs, and families using one shared network.
                  </p>
                </div>
                <div className="landing-panel rounded-[28px] p-5">
                  <dt className="text-sm font-semibold uppercase tracking-[0.18em] text-[#737373]">
                    Placement Success
                  </dt>
                  <dd className="mt-2 text-4xl font-black tracking-tight text-[#171717]">
                    95%
                  </dd>
                  <p className="mt-2 text-sm text-[#52525B]">
                    A smoother path from search to shortlisting and placement.
                  </p>
                </div>
              </dl>
            </div>

            <div className="relative">
              <div className="landing-panel relative overflow-hidden rounded-[34px] p-5 sm:p-7">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
                <div className="rounded-[28px] bg-[#171717] p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.26)] sm:p-8">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
                        Live opportunity preview
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                        Discover high-fit education roles.
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                      Updated daily
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF5A36]/20 text-[#FFB7A7]">
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Secondary Physics Teacher
                          </p>
                          <p className="text-sm text-white/65">
                            Addis Ababa • Full-time
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-white/75">
                        Strong candidate match based on teaching level,
                        classroom experience, and subject fit.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-[#FFF1EC] p-5 text-[#171717]">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9A3412]">
                        Faster hiring signal
                      </p>
                      <p className="mt-3 text-4xl font-black tracking-tight">
                        3x
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#5B5B67]">
                        Clearer candidate data helps schools shortlist with
                        confidence instead of guesswork.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {audienceCards.slice(0, 3).map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                        >
                          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/[0.08] text-[#FFB7A7]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-white/65">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="absolute -bottom-6 left-6 rounded-3xl border border-white/70 bg-white/90 px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur sm:left-auto sm:right-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#737373]">
                    Trust signal
                  </p>
                  <p className="mt-2 text-lg font-black tracking-tight text-[#171717]">
                    Teacher-first onboarding
                  </p>
                  <p className="mt-1 max-w-[18rem] text-sm text-[#52525B]">
                    Clear role entry points help each audience understand where
                    to start immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[34px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8">
            <div className="grid gap-4 md:grid-cols-4">
              {audienceCards.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[28px] border border-[#1F1F1F]/8 bg-[#FFFDFB] p-6 transition hover:border-[#FF5A36]/25 hover:shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEEE8] text-[#FF5A36]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 text-xl font-black tracking-tight text-[#171717]">
                      For {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[#5B5B67]">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C63E21]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#171717] sm:text-5xl">
                A cleaner path from profile to placement.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#5B5B67] sm:text-lg">
                The experience now reads like a product with momentum instead of
                a stack of unrelated sections.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article
                  key={step.title}
                  className="landing-panel rounded-[30px] p-7 sm:p-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171717] text-xl font-black text-white shadow-[0_16px_36px_rgba(23,23,23,0.2)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-6 text-2xl font-black tracking-tight text-[#171717]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[#5B5B67] sm:text-base">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)]">
            <div className="rounded-[34px] bg-[#171717] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FFB7A7]">
                Why teams choose AfterSchool
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Built to feel trustworthy, direct, and conversion-ready.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Better landing pages reduce hesitation. This one now presents
                clearer hierarchy, stronger trust signals, and more focused
                calls to action for each audience.
              </p>

              <div className="mt-8 grid gap-4">
                {featurePoints.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-5"
                    >
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/[0.08] text-[#FFB7A7]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-white/68 sm:text-base">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="landing-panel rounded-[34px] p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#737373]">
                Weekly activity snapshot
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] bg-[#FFF3ED] p-5">
                  <p className="text-sm font-semibold text-[#9A3412]">
                    Applications reviewed
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-[#171717]">
                    128
                  </p>
                  <div className="mt-4 h-3 rounded-full bg-white/80">
                    <div className="h-3 w-[78%] rounded-full bg-[#FF5A36]" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-[#1F1F1F]/8 bg-white p-5">
                    <p className="text-sm font-semibold text-[#737373]">
                      Response time
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-[#171717]">
                      24h
                    </p>
                  </div>
                  <div className="rounded-[24px] border border-[#1F1F1F]/8 bg-white p-5">
                    <p className="text-sm font-semibold text-[#737373]">
                      Active schools
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight text-[#171717]">
                      40+
                    </p>
                  </div>
                </div>
                <div className="rounded-[24px] border border-dashed border-[#FF5A36]/30 bg-[#FFFDFB] p-5">
                  <p className="text-sm leading-7 text-[#5B5B67]">
                    The right-side panel gives the hero a focal point and helps
                    the page feel like a product, not just a brochure.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#C63E21]">
                  Trusted by educators
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#171717] sm:text-5xl">
                  Social proof that feels grounded and credible.
                </h2>
              </div>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 self-start rounded-full border border-[#1F1F1F]/10 bg-white px-5 py-3 text-sm font-semibold text-[#1F1F1F] shadow-[0_14px_32px_rgba(15,23,42,0.06)] transition hover:text-[#C63E21]"
              >
                Explore jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote
                  key={item.name}
                  className="landing-panel rounded-[30px] p-7"
                >
                  <p className="text-base leading-8 text-[#3F3F46] sm:text-lg">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <footer className="mt-6 border-t border-[#1F1F1F]/8 pt-5">
                    <p className="text-lg font-black tracking-tight text-[#171717]">
                      {item.name}
                    </p>
                    <p className="text-sm text-[#737373]">{item.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#171717_0%,#2A1611_50%,#FF5A36_100%)] px-6 py-12 text-white shadow-[0_36px_90px_rgba(23,23,23,0.22)] sm:px-10 sm:py-16 lg:px-14">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  Ready to convert more visitors
                </p>
                <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                  Give teachers and hiring teams a homepage that feels confident
                  from the first screen.
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                  Stronger visuals, cleaner content hierarchy, and better
                  responsive behavior make the product feel more serious and
                  more trustworthy.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-bold text-[#171717] shadow-[0_18px_40px_rgba(255,255,255,0.18)] transition hover:bg-[#FFF3ED]"
                >
                  {isLoggedIn ? "Go to dashboard" : "Create your account"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/jobs"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-4 text-base font-bold text-white transition hover:bg-white/10"
                >
                  Browse open jobs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#1F1F1F]/8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-[#5B5B67] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-black tracking-tight text-[#171717]">
              After<span className="text-[#FF5A36]">School</span>
            </p>
            <p className="mt-1">
              Connecting Ethiopia&apos;s education ecosystem with more clarity
              and speed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/jobs"
              className="font-semibold text-[#1F1F1F] transition hover:text-[#C63E21]"
            >
              Jobs
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="font-semibold text-[#1F1F1F] transition hover:text-[#C63E21]"
              >
                Sign In
              </Link>
            )}
            <Link
              href={isLoggedIn ? "/dashboard" : "/register"}
              className="font-semibold text-[#1F1F1F] transition hover:text-[#C63E21]"
            >
              {isLoggedIn ? "Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
