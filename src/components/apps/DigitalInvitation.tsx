"use client";

import { Icon } from "@/components/Icon";

export default function DigitalInvitation() {
  return (
    <div className="h-full flex flex-col bg-[#faf7f2] text-[#2d2d2d]">
      {/* Preview Header */}
      <div className="h-12 flex items-center px-4 border-b border-black/5 bg-white">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon name="Mail" size={16} className="text-[#d4a574]" />
          <span>Digital Invitation</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs bg-[#d4a574] text-white rounded-md hover:bg-[#c49464] transition-colors">
            Preview
          </button>
          <button className="px-3 py-1.5 text-xs border border-black/10 rounded-md hover:bg-black/5 transition-colors">
            Share
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-black/5">
          {/* Hero Image */}
          <div className="h-48 bg-gradient-to-br from-[#d4a574] via-[#e8c4a0] to-[#f5e6d3] flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <pattern id="floral" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1.5" fill="#8b6914" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#floral)" />
              </svg>
            </div>
            <div className="text-center z-10">
              <div className="text-3xl font-serif text-[#5c4033] mb-1">Save the Date</div>
              <div className="text-sm text-[#8b6914] font-medium">December 25, 2026</div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 text-center">
            <div className="text-sm text-[#8b6914] tracking-widest uppercase mb-4">The Wedding of</div>
            <h2 className="text-3xl font-serif text-[#5c4033] mb-1">Sarah & Michael</h2>
            <div className="w-16 h-px bg-[#d4a574] mx-auto my-4" />
            <p className="text-sm text-[#666] leading-relaxed mb-6">
              Together with our families, we invite you to celebrate our love and join us on our special day.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6 text-xs text-[#666]">
              <div>
                <div className="font-semibold text-[#5c4033] mb-1">Date</div>
                <div>Dec 25, 2026</div>
              </div>
              <div>
                <div className="font-semibold text-[#5c4033] mb-1">Time</div>
                <div>4:00 PM</div>
              </div>
              <div>
                <div className="font-semibold text-[#5c4033] mb-1">Venue</div>
                <div>Garden Villa</div>
              </div>
            </div>

            <button className="w-full py-3 bg-[#5c4033] text-white rounded-lg text-sm font-medium hover:bg-[#4a3329] transition-colors">
              RSVP Now
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-[#faf7f2] text-center text-[10px] text-[#999]">
            Built with Digital Invitation by Lumona
          </div>
        </div>
      </div>
    </div>
  );
}
