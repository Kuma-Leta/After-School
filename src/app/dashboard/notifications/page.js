// app/dashboard/notifications/page.js
"use client";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
export default function NotificationsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <NotificationDropdown />
      {/* Add notifications list */}
    </div>
  );
}
