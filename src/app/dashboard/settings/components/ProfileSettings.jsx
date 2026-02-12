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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Profile Settings
      </h2>
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
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
