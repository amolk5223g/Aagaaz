import React from 'react';
import { MapPin, Calendar, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#080604] border-t border-[#D9AC63]/25 pt-12 pb-24 text-center overflow-hidden">
      {/* Glow overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-[#D9AC63]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center">
        {/* Emblem & Title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#D9AC63] text-lg">✦</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-[#FFD78A] tracking-wider">
            AAGAZZ 2K26
          </span>
          <span className="text-[#D9AC63] text-lg">✦</span>
        </div>

        <p className="font-serif italic text-sm text-[#FFD78A] mb-1">
          "Where Minds Connect and Futures Begin."
        </p>
        <p className="text-xs uppercase tracking-[0.2em] text-[#D9AC63] font-semibold mb-6">
          Explore • Innovate • Excel with AI
        </p>

        {/* Quick event meta */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#B9ADA0] mb-8 bg-[#15100C]/80 px-6 py-3 rounded-full border border-[#D9AC63]/20">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D9AC63]" />
            26 February 2026
          </span>
          <span className="text-[#D9AC63]">•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D9AC63]" />
            10:00 AM – 2:00 PM
          </span>
          <span className="text-[#D9AC63]">•</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D9AC63]" />
            C102, Dept of AI & DS
          </span>
        </div>

        {/* Student Coordinators */}
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#D9AC63]" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#FFD78A] font-bold">
              Student Coordinators
            </span>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#D9AC63]" />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {['Ms. Rakhi Kshirasagar', 'Mr. Shubham Kadam', 'AMOL KUMBHAR'].map((sc) => (
              <span
                key={sc}
                className="px-3 py-1 rounded-full bg-[#15100C] text-[#F8F2E8] text-xs border border-[#D9AC63]/25 font-medium shadow-sm"
              >
                {sc}
              </span>
            ))}
          </div>
        </div>

        {/* Institutional Copyright */}
        <div className="space-y-1 text-[11px] text-[#B9ADA0]/80">
          <p>
            <strong>S. S. Education Trust’s</strong>
          </p>
          <p className="font-semibold text-[#F8F2E8]">
            S. G. Balekundri Institute of Technology
          </p>
          <p>Shivabasava Nagar, Belagavi – 590010, Karnataka, India.</p>
          <p className="text-[#D9AC63] pt-2">
            Organized by Department of Artificial Intelligence and Data Science (Batch 2025–29)
          </p>
        </div>
      </div>
    </footer>
  );
};
