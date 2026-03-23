// app/payment/cancel/page.js
import Link from "next/link";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-semibold mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-6">
          You cancelled the payment. No charges were made. You can try again
          anytime.
        </p>
        <Link
          href="/payment"
          className="inline-block px-6 py-3 bg-[#FF1E00] text-white rounded-lg hover:bg-[#E01B00]"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}
