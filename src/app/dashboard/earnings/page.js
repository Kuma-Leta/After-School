// src/app/dashboard/earnings/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function EarningsPage() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("month"); // 'week', 'month', 'year'
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Mock earnings data
  const mockEarnings = {
    total: 24560,
    pending: 3200,
    paid: 21360,
    thisMonth: 5600,
    lastMonth: 4800,
    growth: "+16.7%",
    averageHourly: 450,
    totalHours: 54.5,
    nextPayout: {
      date: "Jan 31, 2024",
      amount: 3200,
      status: "processing",
    },
  };

  // Mock transactions
  const mockTransactions = [
    {
      id: 1,
      date: "2024-01-15",
      description: "Math Tutoring - St. Mary's School",
      amount: 1800,
      status: "paid",
      type: "teaching",
      hours: 4,
      rate: 450,
      payoutDate: "2024-01-15",
    },
    {
      id: 2,
      date: "2024-01-14",
      description: "Science Workshop - Group Session",
      amount: 2400,
      status: "paid",
      type: "workshop",
      hours: 3,
      rate: 800,
      payoutDate: "2024-01-14",
    },
    {
      id: 3,
      date: "2024-01-13",
      description: "English Tutoring - Private",
      amount: 900,
      status: "pending",
      type: "teaching",
      hours: 2,
      rate: 450,
      payoutDate: "2024-01-20",
    },
    {
      id: 4,
      date: "2024-01-12",
      description: "Test Preparation - Advanced",
      amount: 1500,
      status: "paid",
      type: "teaching",
      hours: 3,
      rate: 500,
      payoutDate: "2024-01-12",
    },
    {
      id: 5,
      date: "2024-01-11",
      description: "Parent Consultation",
      amount: 600,
      status: "paid",
      type: "consultation",
      hours: 1.5,
      rate: 400,
      payoutDate: "2024-01-11",
    },
    {
      id: 6,
      date: "2024-01-10",
      description: "Weekend Workshop",
      amount: 3200,
      status: "paid",
      type: "workshop",
      hours: 4,
      rate: 800,
      payoutDate: "2024-01-10",
    },
  ];

  // Mock payout history
  const mockPayouts = [
    {
      id: 1,
      date: "Jan 15, 2024",
      amount: 4200,
      method: "Bank Transfer",
      status: "completed",
    },
    {
      id: 2,
      date: "Jan 8, 2024",
      amount: 3800,
      method: "Bank Transfer",
      status: "completed",
    },
    {
      id: 3,
      date: "Jan 1, 2024",
      amount: 4100,
      method: "Bank Transfer",
      status: "completed",
    },
    {
      id: 4,
      date: "Dec 25, 2023",
      amount: 3900,
      method: "Bank Transfer",
      status: "completed",
    },
    {
      id: 5,
      date: "Dec 18, 2023",
      amount: 3700,
      method: "Bank Transfer",
      status: "completed",
    },
  ];

  // Mock chart data
  const monthlyData = [
    { month: "Aug", earnings: 3800 },
    { month: "Sep", earnings: 4200 },
    { month: "Oct", earnings: 3900 },
    { month: "Nov", earnings: 4500 },
    { month: "Dec", earnings: 4800 },
    { month: "Jan", earnings: 5600 },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "teaching":
        return "👨‍🏫";
      case "workshop":
        return "👥";
      case "consultation":
        return "🤝";
      default:
        return "💰";
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
              <h1 className="text-2xl md:text-3xl font-bold text-[#1F1F1F]">
                Earnings
              </h1>
              <p className="text-gray-600 mt-1">
                Track your income and manage payouts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setTimeframe("week")}
                  className={`px-4 py-2 rounded-md transition-colors ${timeframe === "week" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe("month")}
                  className={`px-4 py-2 rounded-md transition-colors ${timeframe === "month" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe("year")}
                  className={`px-4 py-2 rounded-md transition-colors ${timeframe === "year" ? "bg-white shadow" : "hover:bg-gray-200"}`}
                >
                  Year
                </button>
              </div>
              <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00] transition-colors font-medium flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Request Payout
              </button>
            </div>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">
                  {formatCurrency(mockEarnings.total)}
                </p>
                <p className="text-xs text-gray-500">Lifetime</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">💰</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available for Payout</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">
                  {formatCurrency(mockEarnings.pending)}
                </p>
                <p className="text-xs text-green-600">
                  {mockEarnings.growth} from last month
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">📤</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">
                  {formatCurrency(mockEarnings.thisMonth)}
                </p>
                <p className="text-xs text-gray-500">
                  {mockEarnings.totalHours} hours
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-lg">📈</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Hourly</p>
                <p className="text-2xl font-bold text-[#1F1F1F]">
                  {formatCurrency(mockEarnings.averageHourly)}
                </p>
                <p className="text-xs text-gray-500">per hour</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-lg">⏱️</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Earnings Chart */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-medium text-[#1F1F1F]">
                  Earnings Overview
                </h3>
                <span className="text-sm text-gray-600">Last 6 months</span>
              </div>
              <div className="h-64 flex items-end space-x-4 justify-center">
                {monthlyData.map((item, index) => (
                  <div key={item.month} className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-2">
                      {item.month}
                    </div>
                    <div className="relative w-12">
                      <div
                        className="bg-[#FF1E00] rounded-t-lg transition-all hover:opacity-90 cursor-pointer"
                        style={{ height: `${(item.earnings / 6000) * 200}px` }}
                        title={`${formatCurrency(item.earnings)}`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatCurrency(item.earnings)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-[#1F1F1F]">
                  Recent Transactions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Date
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Description
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Hours
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Rate
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Amount
                      </th>
                      <th className="text-left p-4 text-sm font-medium text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPayout(transaction)}
                      >
                        <td className="p-4">
                          <div className="text-sm text-gray-900">
                            {transaction.date}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span>{getTypeIcon(transaction.type)}</span>
                            <div>
                              <div className="font-medium text-sm">
                                {transaction.description}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {transaction.type}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{transaction.hours}h</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {formatCurrency(transaction.rate)}/h
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-[#1F1F1F]">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-200 text-center">
                <Link
                  href="/dashboard/transactions"
                  className="text-[#FF1E00] hover:text-[#E01B00] transition-colors text-sm font-medium"
                >
                  View All Transactions →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Next Payout */}
            <div className="bg-gradient-to-r from-[#FF1E00] to-[#FF6B00] rounded-xl shadow p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Next Payout</h3>
                <span className="text-2xl">💳</span>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-bold mb-1">
                  {formatCurrency(mockEarnings.nextPayout.amount)}
                </div>
                <div className="text-sm opacity-90">
                  Scheduled for {mockEarnings.nextPayout.date}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {mockEarnings.nextPayout.status}
                  </span>
                </span>
                <button className="px-4 py-2 bg-white text-[#FF1E00] rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
                  View Details
                </button>
              </div>
            </div>

            {/* Payout History */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-medium text-[#1F1F1F] mb-4">
                Recent Payouts
              </h3>
              <div className="space-y-3">
                {mockPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{payout.date}</div>
                        <div className="text-xs text-gray-600">
                          {payout.method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[#1F1F1F]">
                          {formatCurrency(payout.amount)}
                        </div>
                        <span
                          className={`text-xs ${payout.status === "completed" ? "text-green-600" : "text-blue-600"}`}
                        >
                          {payout.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-center text-[#FF1E00] hover:text-[#E01B00] transition-colors text-sm font-medium">
                View Payout History →
              </button>
            </div>

            {/* Earnings Summary */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-medium text-[#1F1F1F] mb-4">
                This Month Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teaching Hours</span>
                  <span className="font-medium">32h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Workshop Hours</span>
                  <span className="font-medium">12h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Consultation Hours</span>
                  <span className="font-medium">6h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Preparation Hours</span>
                  <span className="font-medium">4.5h</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Hours</span>
                    <span className="font-bold text-[#1F1F1F]">54.5h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="text-yellow-800 text-sm font-medium">
                    Placeholder Component
                  </span>
                  <p className="text-yellow-700 text-sm mt-1">
                    To implement real earnings tracking, you&apos;ll need to: 1.
                    Integrate with payment processor (Stripe, PayPal) 2. Set up
                    automated payout system 3. Create transaction logging 4. Add
                    tax calculation features 5. Implement invoice generation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Details Modal */}
        {selectedPayout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1F1F1F]">
                    Transaction Details
                  </h3>
                  <button
                    onClick={() => setSelectedPayout(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="font-medium">{selectedPayout.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Date</label>
                      <p className="font-medium">{selectedPayout.date}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Amount</label>
                      <p className="font-medium text-[#1F1F1F]">
                        {formatCurrency(selectedPayout.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Hours</label>
                      <p className="font-medium">{selectedPayout.hours}h</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Rate</label>
                      <p className="font-medium">
                        {formatCurrency(selectedPayout.rate)}/h
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedPayout.status)}`}
                    >
                      {selectedPayout.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Payout Date</label>
                    <p className="font-medium">{selectedPayout.payoutDate}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedPayout(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00]">
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
