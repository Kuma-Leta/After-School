"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const ROLES = [
  { id: "teacher", label: "Teacher/Tutor", description: "Find teaching jobs" },
  {
    id: "student",
    label: "University Student",
    description: "Find part-time opportunities",
  },
  { id: "school", label: "School", description: "Hire tutors and assistants" },
  {
    id: "ngo",
    label: "Organization/NGO",
    description: "Find educational staff",
  },
  {
    id: "family",
    label: "Family/Parent",
    description: "Find tutors for your children",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "",
  });

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setFormData((prev) => ({ ...prev, role: roleId }));
    setError("");
  };

  const handleNext = () => {
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }
    setStep(2);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^(\+251|0)(9|7)\d{8}$/;
    const cleaned = phone.replace(/\s+/g, "");
    return re.test(cleaned);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    // Client-side validation
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone =
        "Please enter a valid Ethiopian phone number (e.g., +251 9XX XXX XXX)";
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Check if email already exists by trying to sign in first
      const { data: existingAuth, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: "dummy_password_for_check", // Random password for checking
        });

      // If sign in doesn't fail with "Invalid login credentials", email might exist
      if (!signInError || signInError.message !== "Invalid login credentials") {
        setError(
          "An account with this email already exists. Please try logging in instead.",
        );
        setLoading(false);
        return;
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: formData.role,
            full_name: formData.full_name,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) {
        // Handle specific Supabase errors
        if (
          authError.message.includes("User already registered") ||
          authError.message.includes("already registered") ||
          authError.code === "user_already_exists"
        ) {
          throw new Error(
            "An account with this email already exists. Please try logging in.",
          );
        } else if (authError.message.includes("invalid email")) {
          throw new Error("Please enter a valid email address.");
        } else if (authError.message.includes("Password should be at least")) {
          throw new Error("Password must be at least 6 characters.");
        } else {
          throw authError;
        }
      }

      if (authData?.user) {
        // Create role-specific profile
        const role = formData.role;

        try {
          if (role === "teacher") {
            await supabase.from("teachers").insert([
              {
                id: authData.user.id,
              },
            ]);
          } else if (role === "student") {
            await supabase.from("students").insert([
              {
                id: authData.user.id,
              },
            ]);
          } else if (["school", "ngo", "family"].includes(role)) {
            const orgType = role === "family" ? "individual" : role;
            await supabase.from("organizations").insert([
              {
                id: authData.user.id,
                org_name: formData.full_name,
                org_type: orgType,
                contact_person: formData.full_name,
              },
            ]);
          }

          // Success - show confirmation message
          setSuccess(true);

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            router.push("/login");
          }, 5000);
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
          // If profile creation fails, user can still try again
          throw new Error("Profile creation failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("Registration error:", err);

      // User-friendly error messages
      const errorMessages = {
        "User already registered":
          "An account with this email already exists. Please try logging in.",
        "already registered":
          "An account with this email already exists. Please try logging in.",
        user_already_exists:
          "An account with this email already exists. Please try logging in.",
        "Password should be at least":
          "Password must be at least 6 characters long.",
        "Invalid login credentials":
          "Invalid credentials. Please check your email and password.",
        "Email not confirmed":
          "Please check your email to confirm your account.",
        NetworkError:
          "Network error. Please check your internet connection and try again.",
      };

      const errorMessage =
        errorMessages[err.message] ||
        errorMessages[err.code] ||
        err.message ||
        "Registration failed. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Registration Successful!
            </h2>
            <div className="mt-4 space-y-4">
              <p className="text-gray-600">
                We&apos;ve sent a confirmation email to{" "}
                <strong>{formData.email}</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                Please check your inbox (and spam folder) and click the
                confirmation link to verify your account.
              </p>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-700 text-sm">
                  ✉️ <strong>Important:</strong> You must confirm your email
                  before you can log in.
                </p>
              </div>
              <p className="text-gray-500 text-sm">
                Redirecting to login page in 5 seconds...
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
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
            Join After<span className="text-[#FF1E00]">School</span>
          </h2>
          <p className="mt-2 text-gray-600">
            Create your account to get started
          </p>
        </div>

        {step === 1 ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4">
              Choose Your Role
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                    selectedRole === role.id
                      ? "border-[#FF1E00] bg-[#FF1E00]/5 shadow-sm"
                      : "border-gray-200 hover:border-[#FF1E00]/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-[#1F1F1F]">{role.label}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {role.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedRole}
                className="w-full py-3 px-4 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                Continue
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#FF1E00] hover:text-[#E01B00]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <form
            className="bg-white rounded-xl shadow-lg p-6"
            onSubmit={handleSubmit}
          >
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center text-[#FF1E00] hover:text-[#E01B00] text-sm font-medium"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to role selection
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#FF1E00]/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-[#FF1E00] text-sm font-medium">
                    {selectedRole === "teacher"
                      ? "👨‍🏫"
                      : selectedRole === "student"
                        ? "🎓"
                        : selectedRole === "school"
                          ? "🏫"
                          : selectedRole === "ngo"
                            ? "🤝"
                            : "👨‍👩‍👧"}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-[#1F1F1F]">
                    {ROLES.find((r) => r.id === selectedRole)?.label}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ROLES.find((r) => r.id === selectedRole)?.description}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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
                    <span className="text-red-700 text-sm">{error}</span>
                    {error.includes("already exists") && (
                      <div className="mt-2">
                        <Link
                          href="/login"
                          className="text-[#FF1E00] hover:text-[#E01B00] text-sm font-medium inline-flex items-center"
                        >
                          Click here to sign in instead
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] ${
                    errors.full_name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.full_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] ${
                    errors.phone ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="+251 9XX XXX XXX"
                />
                {errors.phone ? (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Format: +251 9XX XXX XXX or 09XX XXX XXX
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00] ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 6 characters
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600 text-sm">
                By creating an account, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-[#FF1E00] hover:text-[#E01B00] font-medium"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-[#FF1E00] hover:text-[#E01B00] font-medium"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
