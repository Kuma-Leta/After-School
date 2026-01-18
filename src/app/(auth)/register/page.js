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
  const [step, setStep] = useState(1); // 1: Role selection, 2: Registration form
  const [selectedRole, setSelectedRole] = useState("");

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
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
        },
      });

      if (authError) throw authError;

      // Create role-specific profile
      if (authData.user) {
        const role = formData.role;

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
          await supabase.from("organizations").insert([
            {
              id: authData.user.id,
              org_name: formData.full_name,
              org_type: role === "family" ? "individual" : role,
            },
          ]);
        }
      }

      // Success - show confirmation
      alert(
        "Registration successful! Please check your email to confirm your account.",
      );
      router.push("/login");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join AfterSchool
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
              Choose your role
            </h3>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    selectedRole === role.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-blue-300"
                  }`}
                >
                  <div className="font-medium text-gray-900">{role.label}</div>
                  <div className="text-sm text-gray-600">
                    {role.description}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="+251 9XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Create a strong password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  At least 8 characters with letters and numbers
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Role:</span>{" "}
                  {ROLES.find((r) => r.id === selectedRole)?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-1 text-sm text-blue-600 hover:text-blue-500"
                >
                  Change role
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
