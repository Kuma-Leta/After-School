// app/dashboard/candidates/components/Layout/Header.js
import { ArrowLeft, Bell } from "lucide-react";

export default function Header({ title, description, onBack, showBackButton }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* You can add notification bell or other icons here */}
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <Bell className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
