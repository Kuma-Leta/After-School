"use client";

import { User, Bell, Shield, CreditCard, Lock } from "lucide-react";

const defaultTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

export default function SettingsSidebar({
  activeTab,
  onTabChange,
  subscription,
  tabs = defaultTabs,
}) {
  return (
    <div className="md:w-64 space-y-1">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">
          Settings
        </h2>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-[#FF1E00] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-5 h-5 mr-3" />
              {tab.label}
              {tab.id === "subscription" && subscription?.isTrialActive && (
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Trial
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
