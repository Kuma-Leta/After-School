"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const authCheckRef = useRef(false);

  // Check if user is already logged in
  useEffect(() => {
    if (authCheckRef.current) return;
    authCheckRef.current = true;

    async function checkAuth() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setAuthChecked(true);
          return;
        }

        if (session) {
          // Get redirect URL from query params or default to dashboard
          const redirectTo = searchParams.get("redirect") || "/dashboard";
          console.log("Already logged in, redirecting to:", redirectTo);

          // Try multiple approaches to ensure redirect works
          try {
            // First try replace
            router.replace(redirectTo);
            // Force a refresh to update middleware/auth state
            setTimeout(() => {
              router.refresh();
            }, 100);
          } catch (routerError) {
            console.error("Router error:", routerError);
            // Fallback to push
            router.push(redirectTo);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [router, searchParams]); // Add searchParams to dependencies

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: formData.email.trim(),
          password: formData.password,
        },
      );

      if (authError) {
        // Handle specific errors
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        } else if (authError.message.includes("Email not confirmed")) {
          throw new Error("Please confirm your email before logging in.");
        } else if (authError.message.includes("rate limit")) {
          throw new Error(
            "Too many attempts. Please try again in a few minutes.",
          );
        } else {
          throw authError;
        }
      }

      console.log("Login successful, user:", data.user?.email);

      // IMPORTANT: Wait a moment for session to be established
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify session was created
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session not created. Please try again.");
      }

      // Get redirect URL
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      console.log("Redirecting to:", redirectTo);

      // Force hard navigation to ensure middleware runs
      window.location.href = redirectTo;

      // Alternative: Use router with refresh
      // router.replace(redirectTo);
      // router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  // Handle Google OAuth login
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        throw new Error("Google sign-in failed. Please try again.");
      }

      // The OAuth flow will redirect to Google, then back to /auth/callback
      console.log("Google OAuth initiated:", data);
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email.trim()) {
      setError("Please enter your email address to reset password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (error) throw error;

      // Show success message
      setError("success");
      alert("Password reset email sent! Check your inbox for instructions.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Failed to send reset email. Please check your email address.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF1E00] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FF1E00] rounded-lg mb-4">
            <span className="text-white font-bold text-lg">AS</span>
          </div>
          <h2 className="text-3xl font-bold text-[#1F1F1F]">
            Welcome to After<span className="text-[#FF1E00]">School</span>
          </h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {error && error !== "success" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-red-700 text-sm font-medium">
                    Login Error
                  </span>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {error === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-green-700 text-sm font-medium">
                    Success!
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Password reset email sent! Check your inbox.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full mb-6 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {googleLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-3 text-gray-500 text-sm">
              Or continue with email
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading || googleLoading}
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || googleLoading}
                  className="text-sm text-[#FF1E00] hover:text-[#E01B00] transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading || googleLoading}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 px-4 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-[#FF1E00] hover:text-[#E01B00] transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>

          {/* Demo credentials for testing */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              For testing: test@example.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
