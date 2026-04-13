
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

import { Check, X } from "lucide-react";
import ProfilePage from "../../profile/page";
export default function ProfileSettings({ user, profile, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    location: "",
    date_of_birth: "",
    gender: "",
    languages: [],
    phone: "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        languages: profile.languages || [],
        phone: profile.phone || "",
        email: user?.email || "",
      });
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLanguagesChange = (selected) => {
    setFormData({ ...formData, languages: selected });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updates = {
        ...formData,
        id: user.id,
        updated_at: new Date().toISOString(),
        avatar_url: avatarUrl,
        role: profile?.role || "user", // Add this to provide a default value for the non-nullable 'role' column
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully!" });
      onUpdate({ ...profile, ...updates });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };
// ...existing code...


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Profile Settings
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Languages
          </label>
          <LanguageSelector selected={formData.languages} onChange={handleLanguagesChange} />
        </div>
        {message.text && (
          <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      <ProfilePage />
    </div>
  );
}

// Simple language selector – expand as needed
function LanguageSelector({ selected = [], onChange }) {
  const languages = [
    "Amharic",
    "English",
    "Oromo",
    "Tigrinya",
    "Somali",
    "French",
    "Arabic",
  ];

  const toggle = (lang) => {
    if (selected.includes(lang)) {
      onChange(selected.filter((l) => l !== lang));
    } else {
      onChange([...selected, lang]);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {languages.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => toggle(lang)}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-sm font-medium transition-colors ${
            selected.includes(lang)
              ? "bg-[#FF1E00] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}


