// app/page.js
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

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
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#FF1E00] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">AS</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-[#1F1F1F]">
                After<span className="text-[#FF1E00]">School</span>
              </span>
              <p className="text-xs text-gray-500 -mt-1">Ethiopia</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
              Connect Ethiopia's{" "}
              <span className="text-[#FF1E00]">Brightest</span> Minds with
              Opportunities
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              AfterSchool bridges the gap between qualified educators, students,
              and educational institutions. Find tutors, teaching assistants,
              and educational staff across Ethiopia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {!isLoggedIn ? (
                <>
                  <Link
                    href="/register?role=teacher"
                    className="px-8 py-4 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                  >
                    <span>Find Teaching Jobs</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </Link>
                  <Link
                    href="/register?role=school"
                    className="px-8 py-4 bg-white text-[#1F1F1F] border-2 border-[#1F1F1F] rounded-lg hover:bg-[#1F1F1F] hover:text-white transition-colors font-medium text-lg"
                  >
                    Hire Qualified Talent
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium text-lg shadow-lg"
                >
                  Go to Your Dashboard
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8 justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1F1F1F]">500+</div>
                <div className="text-gray-600 text-sm mt-1">
                  Qualified Teachers
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1F1F1F]">150+</div>
                <div className="text-gray-600 text-sm mt-1">Schools & NGOs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#1F1F1F]">95%</div>
                <div className="text-gray-600 text-sm mt-1">Success Rate</div>
              </div>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:w-1/2">
            <div className="bg-gradient-to-br from-[#1F1F1F] to-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl text-[#FF1E00]">👨‍🏫</span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Teachers
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Find jobs that match your skills
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl text-[#FF1E00]">🏫</span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Schools
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Hire verified educators
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl text-[#FF1E00]">🎓</span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Students
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Part-time work opportunities
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform">
                  <div className="w-12 h-12 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mb-4">
                    <span className="text-2xl text-[#FF1E00]">👨‍👩‍👧</span>
                  </div>
                  <div className="text-lg font-semibold text-[#1F1F1F]">
                    For Families
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Private tutors for your children
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section className="mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F1F1F] mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple three-step process to connect educators with opportunities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:border-[#FF1E00]/20 transition-colors">
              <div className="w-14 h-14 bg-[#FF1E00]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl text-[#FF1E00]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Teachers and students create detailed profiles with
                qualifications, subjects, experience, and availability.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:border-[#FF1E00]/20 transition-colors">
              <div className="w-14 h-14 bg-[#FF1E00]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl text-[#FF1E00]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">
                Browse & Apply
              </h3>
              <p className="text-gray-600">
                Schools and organizations post jobs. Find opportunities that
                match your skills and apply directly.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:border-[#FF1E00]/20 transition-colors">
              <div className="w-14 h-14 bg-[#FF1E00]/10 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl text-[#FF1E00]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[#1F1F1F] mb-4">
                Connect & Teach
              </h3>
              <p className="text-gray-600">
                Communicate through our secure platform, complete hiring
                process, and start making an impact.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-32 bg-gradient-to-r from-[#FF1E00]/5 to-transparent rounded-3xl p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#1F1F1F] mb-6">
                Why Choose AfterSchool?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF1E00]">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1F1F1F]">
                      Verified Profiles
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      All educators are verified with academic credentials
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF1E00]">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1F1F1F]">
                      Local Focus
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Designed specifically for Ethiopia's education needs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF1E00]">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1F1F1F]">
                      Secure Communication
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Built-in messaging with safety features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FF1E00]">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1F1F1F]">
                      Flexible Payments
                    </h4>
                    <p className="text-gray-600 text-sm mt-1">
                      Local payment options including Chapa and Telebirr
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="aspect-video bg-gradient-to-br from-[#1F1F1F] to-[#2A2A2A] rounded-xl flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-2">Perfect Match</h3>
                  <p>
                    Our algorithm connects the right educators with the right
                    opportunities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-32 text-center">
          <div className="bg-gradient-to-r from-[#FF1E00] to-[#FF4D00] rounded-2xl p-12 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
                  backgroundSize: "100px 100px",
                }}
              ></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-6">
                Ready to Transform Education in Ethiopia?
              </h2>
              <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
                Join hundreds of educators, students, and organizations building
                Ethiopia's educational future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center px-10 py-4 bg-white text-[#FF1E00] rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg shadow-2xl hover:shadow-3xl"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start Free Today"}
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-10 py-4 bg-transparent text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors font-medium text-lg"
                >
                  Learn More
                </Link>
              </div>
              <p className="text-white/70 text-sm mt-6">
                No credit card required • Free for educators to join
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1F1F1F] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#FF1E00] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AS</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">
                    After<span className="text-[#FF1E00]">School</span>
                  </span>
                  <p className="text-gray-400 text-sm">
                    Ethiopia's Education Network
                  </p>
                </div>
              </div>
              <p className="text-gray-400 max-w-md">
                Connecting Ethiopia's education ecosystem through technology and
                innovation.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Platform</h4>
                <ul className="space-y-2">
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
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2">
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
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Support</h4>
                <ul className="space-y-2">
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
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} AfterSchool Ethiopia. All rights
              reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">
                Addis Ababa, Ethiopia
              </span>
              <div className="flex space-x-4">
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
