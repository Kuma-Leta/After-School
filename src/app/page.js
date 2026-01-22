// app/page.js
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { GraduationCap, School, BookOpen, Users } from "lucide-react";

export default async function Home() {
  // Check if user is logged in to show appropriate CTAs
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1F1F1F]/5 to-white">
      {/* Navigation */}
      <nav className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FF1E00] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold text-[#1F1F1F]">
                After<span className="text-[#FF1E00]">School</span>
              </span>
              <p className="text-xs text-gray-500 -mt-1">Ethiopia</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium shadow-sm hover:shadow"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-[#1F1F1F] hover:text-[#FF1E00] font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2.5 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium shadow-sm hover:shadow"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FF1E00]/10 text-[#FF1E00] text-sm font-medium mb-6">
              🇪🇹 Made for Ethiopia
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1F1F1F] leading-tight">
              Ethiopia’s #1 Platform for
              <span className="text-[#FF1E00]"> Teaching Jobs & Tutors</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Find teaching jobs, hire qualified educators, and connect with
              tutors — all in one platform built for Ethiopia.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full">
              {!isLoggedIn ? (
                <>
                  {/* Primary CTA */}
                  <Link
                    href="/register?role=teacher"
                    className="relative px-8 py-4 bg-[#FF1E00] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group overflow-hidden"
                  >
                    <span className="relative z-10">Find Teaching Jobs</span>
                    <span className="relative z-10 group-hover:translate-x-1 transition-transform">
                      →
                    </span>

                    {/* Hover glow */}
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition" />
                  </Link>

                  {/* Secondary CTA */}
                  <Link
                    href="/register?role=school"
                    className="px-8 py-4 rounded-xl font-semibold text-lg border-2 border-[#1F1F1F] text-[#1F1F1F] bg-white
                   hover:bg-[#1F1F1F] hover:text-white hover:shadow-md
                   transition-all duration-200 flex items-center justify-center"
                  >
                    Hire Qualified Talent
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-[#FF1E00] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                >
                  Go to Your Dashboard
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto lg:mx-0">
              {/* Stat 1 */}
              <div className="text-center bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="text-4xl font-extrabold text-[#1F1F1F]">
                  500<span className="text-[#FF1E00]">+</span>
                </div>
                <div className="text-gray-600 text-sm mt-2">
                  Qualified Teachers
                </div>
                <p className="text-xs text-gray-400 mt-1">Verified profiles</p>
              </div>

              {/* Stat 2 */}
              <div className="text-center bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="text-4xl font-extrabold text-[#1F1F1F]">
                  150<span className="text-[#FF1E00]">+</span>
                </div>
                <div className="text-gray-600 text-sm mt-2">Schools & NGOs</div>
                <p className="text-xs text-gray-400 mt-1">
                  Nationwide partners
                </p>
              </div>

              {/* Stat 3 */}
              <div className="text-center bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="text-4xl font-extrabold text-[#1F1F1F]">
                  95<span className="text-[#FF1E00]">%</span>
                </div>
                <div className="text-gray-600 text-sm mt-2">Success Rate</div>
                <p className="text-xs text-gray-400 mt-1">
                  Successful placements
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:w-1/2">
            <div className="bg-[#F9FAFB] rounded-2xl p-8 border border-gray-200">
              <div className="grid grid-cols-2 gap-6">
                {/* For Teachers */}
                <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-[#FF1E00] transition">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6 text-[#FF1E00]" />
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Teachers
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Find teaching jobs that match your skills
                  </div>
                </div>

                {/* For Schools */}
                <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-[#FF1E00] transition">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <School className="w-6 h-6 text-[#FF1E00]" />
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Schools
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Hire verified and experienced educators
                  </div>
                </div>

                {/* For Students */}
                <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-[#FF1E00] transition">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-[#FF1E00]" />
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Students
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Flexible part-time teaching opportunities
                  </div>
                </div>

                {/* For Families */}
                <div className="group bg-white p-6 rounded-xl border border-gray-200 hover:border-[#FF1E00] transition">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-[#FF1E00]" />
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Families
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Find trusted private tutors for your children
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section className="mt-32">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-semibold text-[#FF1E00] bg-[#FF1E00]/10 px-4 py-1 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1F1F1F] mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              A simple and transparent process connecting educators with the
              right opportunities.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all group">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-[#FF1E00] text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                1
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mt-6 mb-4">
                Create Your Profile
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Teachers and students build detailed profiles including
                qualifications, subjects, experience, and availability.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all group">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-[#FF1E00] text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                2
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mt-6 mb-4">
                Browse & Apply
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Schools and organizations post opportunities. Find jobs that
                match your skills and apply directly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all group">
              <div className="absolute -top-6 left-8 w-12 h-12 bg-[#FF1E00] text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                3
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mt-6 mb-4">
                Connect & Teach
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Communicate securely, complete the hiring process, and start
                making a real impact through teaching.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-32 px-4 sm:px-6 lg:px-0">
          <div
            className="bg-gradient-to-r from-[#FF1E00]/5 to-transparent rounded-3xl 
                  p-8 sm:p-10 lg:p-12 max-w-7xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1F1F1F] mb-6">
                  Why Choose AfterSchool?
                </h2>

                <div className="space-y-6">
                  {[
                    {
                      title: "Verified Profiles",
                      desc: "All educators are verified with academic credentials",
                    },
                    {
                      title: "Local Focus",
                      desc: "Designed specifically for Ethiopia’s education needs",
                    },
                    {
                      title: "Secure Communication",
                      desc: "Built-in messaging with safety features",
                    },
                    {
                      title: "Flexible Payments",
                      desc: "Local payment options including Chapa and Telebirr",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="w-9 h-9 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF1E00] font-bold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1F1F1F] text-base">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Visual Card */}
              <div className="w-full">
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
                  <div
                    className="aspect-video rounded-xl bg-gradient-to-br from-[#1F1F1F] to-[#2A2A2A] 
                          flex items-center justify-center"
                  >
                    <div className="text-center text-white px-6">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-2xl font-bold mb-2">Perfect Match</h3>
                      <p className="text-sm sm:text-base text-white/90">
                        Our algorithm connects the right educators with the
                        right opportunities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 px-4 sm:px-6 lg:px-0">
          <div
            className="relative max-w-7xl mx-auto overflow-hidden rounded-3xl
                  bg-gradient-to-r from-[#FF1E00] to-[#FF4D00]"
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
            radial-gradient(circle at 20px 20px, white 2%, transparent 0%),
            radial-gradient(circle at 80px 80px, white 2%, transparent 0%)
          `,
                  backgroundSize: "120px 120px",
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-14 sm:py-16 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                Ready to Transform Education in Ethiopia?
              </h2>

              <p className="text-white/90 text-base sm:text-lg lg:text-xl mb-10 max-w-3xl mx-auto">
                Join hundreds of educators, students, and organizations shaping
                Ethiopia&apos;s educational future—together.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center px-10 py-4
                     bg-white text-[#FF1E00] rounded-xl font-bold text-lg
                     shadow-xl hover:shadow-2xl hover:-translate-y-0.5
                     transition-all duration-200"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start Free Today"}
                </Link>

                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-10 py-4
                     bg-white/10 text-white border border-white/30 rounded-xl
                     font-medium text-lg hover:bg-white/20
                     transition-colors"
                >
                  Learn More
                </Link>
              </div>

              {/* Trust Note */}
              <p className="text-white/70 text-sm mt-6">
                No credit card required • Free for educators to join
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1F1F1F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#FF1E00] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AS</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    After<span className="text-[#FF1E00]">School</span>
                  </span>
                  <p className="text-gray-400 text-sm">
                    Ethiopia&apos;s Education Network
                  </p>
                </div>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Connecting Ethiopia&apos;s education ecosystem through
                technology, opportunity, and innovation.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-3">
              {/* Platform */}
              <div>
                <h4 className="font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/find-jobs"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Find Jobs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/find-tutors"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Find Tutors
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/about"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link
                      href="/help"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faq"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/community"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Community
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm text-center sm:text-left">
              © {new Date().getFullYear()} AfterSchool Ethiopia. All rights
              reserved.
            </p>

            <div className="flex items-center gap-6">
              <span className="text-gray-400 text-sm">
                Addis Ababa, Ethiopia
              </span>

              {/* Social Icons */}
              <div className="flex gap-4 text-lg">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  📘
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  🐦
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  📷
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
