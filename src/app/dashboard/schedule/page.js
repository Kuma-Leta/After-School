// src/app/dashboard/schedule/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week"); // 'day', 'week', 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock schedule data
  const mockSchedule = [
    {
      id: 1,
      title: "Math Tutoring - St. Mary's",
      time: "9:00 AM - 10:30 AM",
      date: "2024-01-15",
      type: "teaching",
      status: "confirmed",
      student: "John Smith",
      subject: "Mathematics",
      location: "Room 204",
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 2,
      title: "Science Workshop",
      time: "11:00 AM - 12:30 PM",
      date: "2024-01-15",
      type: "workshop",
      status: "confirmed",
      student: "Group Class",
      subject: "Science",
      location: "Lab B",
      color: "bg-green-100 text-green-800"
    },
    {
      id: 3,
      title: "Parent Meeting",
      time: "2:00 PM - 3:00 PM",
      date: "2024-01-15",
      type: "meeting",
      status: "pending",
      student: "Sarah Johnson (Parent)",
      subject: "Progress Review",
      location: "Virtual - Zoom",
      color: "bg-purple-100 text-purple-800"
    },
    {
      id: 4,
      title: "English Tutoring",
      time: "4:00 PM - 5:30 PM",
      date: "2024-01-16",
      type: "teaching",
      status: "confirmed",
      student: "Emily Davis",
      subject: "English Literature",
      location: "Library",
      color: "bg-blue-100 text-blue-800"
    },
    {
      id: 5,
      title: "Training Session",
      time: "10:00 AM - 11:30 AM",
      date: "2024-01-17",
      type: "training",
      status: "confirmed",
      student: "Staff Development",
      subject: "New Curriculum",
      location: "Conference Room",
      color: "bg-orange-100 text-orange-800"
    },
    {
      id: 6,
      title: "Physics Tutoring",
      time: "1:00 PM - 2:30 PM",
      date: "2024-01-18",
      type: "teaching",
      status: "tentative",
      student: "Michael Brown",
      subject: "Physics",
      location: "Room 105",
      color: "bg-blue-100 text-blue-800"
    },
  ];

  // Mock calendar days
  const weekDays = [
    { day: "Mon", date: "15", fullDate: "2024-01-15", today: true },
    { day: "Tue", date: "16", fullDate: "2024-01-16" },
    { day: "Wed", date: "17", fullDate: "2024-01-17" },
    { day: "Thu", date: "18", fullDate: "2024-01-18" },
    { day: "Fri", date: "19", fullDate: "2024-01-19" },
    { day: "Sat", date: "20", fullDate: "2024-01-20" },
    { day: "Sun", date: "21", fullDate: "2024-01-21" },
  ];

  // Mock time slots
  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", 
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", 
    "4:00 PM", "5:00 PM", "6:00 PM"
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  const getEventsForDate = (date) => {
    return mockSchedule.filter(event => event.date === date);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed': return '✅';
      case 'pending': return '🕒';
      case 'tentative': return '❓';
      case 'cancelled': return '❌';
      default: return '📅';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'teaching': return '👨‍🏫';
      case 'workshop': return '👥';
      case 'meeting': return '🤝';
      case 'training': return '📚';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-100 rounded-lg"></div>
                <div className="h-48 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-100 rounded-lg"></div>
                <div className="h-32 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F1F1F]">My Schedule</h1>
              <p className="text-gray-600 mt-1">Manage your teaching sessions and appointments</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView("day")}
                  className={`px-4 py-2 rounded-md transition-colors ${view === "day" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Day
                </button>
                <button
                  onClick={() => setView("week")}
                  className={`px-4 py-2 rounded-md transition-colors ${view === "week" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView("month")}
                  className={`px-4 py-2 rounded-md transition-colors ${view === "month" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Month
                </button>
              </div>
              <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today&apos;s Sessions</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">3</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📅</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">12</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">📆</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">8</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">⏰</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours This Week</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">24</p>
                <p className="text-xs text-gray-500">+2 from last week</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {/* Calendar Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-[#1F1F1F]">January 15-21, 2024</h2>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Today: </span>Mon, Jan 15
                  </div>
                </div>
              </div>

              {/* Week View */}
              {view === "week" && (
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day.date}
                        className={`text-center p-3 rounded-lg ${day.today ? "bg-[#FF1E00] text-white" : "bg-gray-50"}`}
                      >
                        <div className="text-sm font-medium">{day.day}</div>
                        <div className="text-xl font-bold mt-1">{day.date}</div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="border rounded-lg overflow-hidden">
                    {timeSlots.map((time) => (
                      <div key={time} className="flex border-b last:border-b-0">
                        <div className="w-20 p-3 border-r bg-gray-50 text-sm text-gray-600">
                          {time}
                        </div>
                        <div className="flex-1 grid grid-cols-7">
                          {weekDays.map((day) => {
                            const events = getEventsForDate(day.fullDate).filter(
                              event => event.time.includes(time.split(" ")[0])
                            );
                            return (
                              <div key={`${day.date}-${time}`} className="p-1 border-r last:border-r-0 min-h-[60px]">
                                {events.map((event) => (
                                  <div
                                    key={event.id}
                                    className={`p-2 rounded-lg mb-1 text-xs ${event.color} cursor-pointer hover:opacity-90`}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="truncate">{event.time}</div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Day View */}
              {view === "day" && (
                <div className="p-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#1F1F1F]">Monday, January 15</h3>
                    <p className="text-gray-600">Today&apos;s schedule</p>
                  </div>
                  <div className="space-y-4">
                    {getEventsForDate("2024-01-15").map((event) => (
                      <div key={event.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{getTypeIcon(event.type)}</span>
                              <span className="font-medium text-[#1F1F1F]">{event.title}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${event.color}`}>
                                {event.type}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Time:</span>
                                <p className="font-medium">{event.time}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">With:</span>
                                <p className="font-medium">{event.student}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Subject:</span>
                                <p className="font-medium">{event.subject}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <p className="font-medium">{event.location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-lg">{getStatusIcon(event.status)}</span>
                            <span className="text-xs capitalize px-2 py-1 rounded-full bg-gray-100">
                              {event.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Month View Placeholder */}
              {view === "month" && (
                <div className="p-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-[#1F1F1F]">January 2024</h3>
                    <p className="text-gray-600">Monthly view coming soon</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📅</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Calendar View</h3>
                    <p className="text-gray-600 mb-4">
                      This view will show your entire month at a glance with color-coded events
                    </p>
                    <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium">
                      Switch to Week View
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-medium text-[#1F1F1F] mb-4">Upcoming This Week</h3>
              <div className="space-y-3">
                {mockSchedule.slice(0, 4).map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{getTypeIcon(event.type)}</span>
                          <span className="font-medium text-sm">{event.title}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {event.date} • {event.time}
                        </div>
                      </div>
                      <span className="text-lg">{getStatusIcon(event.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-center text-[#FF1E00] hover:text-[#E01B00] transition-colors text-sm font-medium">
                View All Events →
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-medium text-[#1F1F1F] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span>Request Time Off</span>
                  <span>📝</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span>Set Availability</span>
                  <span>🕒</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span>Sync Calendar</span>
                  <span>🔄</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span>Export Schedule</span>
                  <span>📤</span>
                </button>
              </div>
            </div>

            {/* Placeholder Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="text-yellow-800 text-sm font-medium">Placeholder Component</span>
                  <p className="text-yellow-700 text-sm mt-1">
                    To implement a real schedule system, you&apos;ll need to:
                    1. Create a database table for appointments/sessions
                    2. Implement calendar integration (Google Calendar, Outlook)
                    3. Add real-time availability checking
                    4. Set up notifications and reminders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}