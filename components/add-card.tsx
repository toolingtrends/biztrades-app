"use client"

import Image from "next/image"

export default function AdCard() {
  return (
    <div className="bg-white border border-gray-250 rounded-lg shadow-sm overflow-hidden">
      {/* Top Image */}
      <div className="relative w-full h-48">
        <Image
          src={"/images/gpex.jpg"}
          alt="Sponsored: Demo Units Available"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Bottom Content Panel */}
      <div className="border-t border-gray-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-gray-800 leading-tight">Demo Units Available</h3>
        <p className="text-sm text-gray-600 mt-1 leading-6">Ultra-low phase fluctuation (0.002π rad)</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">santec.com</span>
          <button
            aria-label="Visit sponsor"
            className="w-10 h-10 rounded-full shadow-md bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-800"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
