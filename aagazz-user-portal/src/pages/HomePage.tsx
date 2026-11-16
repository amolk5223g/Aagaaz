import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  Gamepad2,
  Trophy,
  Star,
  ArrowRight,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Countdown } from '../components/Countdown';
import { ParticlesBackground } from '../components/ParticlesBackground';

export const HomePage: React.FC = () => {
  const [posterModal, setPosterModal] = useState(false);

  const pillars = [
    {
      title: 'Music & Dance',
      desc: 'Electrifying beats, live acoustic rhythm sessions and stunning departmental dance performances.',
      icon: Music,
    },
    {
      title: 'Fun Games',
      desc: 'High-energy icebreakers, live stage battles, rapid-fire trivia and interactive team showdowns.',
      icon: Gamepad2,
    },
    {
      title: 'Exciting Events',
      desc: 'Freshers spotlight reveals, Mr. & Ms. Freshers crowning gala, talent showcase and memory captures.',
      icon: Trophy,
    },
    {
      title: 'And Much More...',
      desc: 'Delicious banquet feast, exclusive photo-ops, gold memorabilia and lifetime bonds with peers.',
      icon: Star,
    },
  ];

  const dignitaries = [
    {
      name: 'Dr. B. R. Patagundi',
      title: 'Principal, SGBIT',
      role: 'Chief Guest',
      icon: 'military_tech',
      desc: 'Visionary institutional leadership fostering excellence in technical research and student innovation.',
    },
    {
      name: 'Dr. F. V. Manvi',
      title: 'Chairman, Governing Council, SGBIT',
      role: 'Guest of Honour',
      icon: 'workspace_premium',
      desc: 'Eminent academic leader and guiding pillar of S. S. Education Trust.',
    },
    {
      name: 'Dr. Malikarjun Math',
      title: 'Head of Department',
      role: 'Dept. of AI & DS',
      icon: 'neurology',
      desc: 'Driving cutting-edge Artificial Intelligence curriculum and student mentorship.',
    },
    {
      name: 'Prof. Neha Jadhav',
      title: 'Assistant Professor, AI & DS',
      role: 'Faculty Coordinator',
      icon: 'verified',
      desc: 'Guiding and organizing the AAGAZZ 2K26 celebration for the incoming 2025–29 batch.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#080604] overflow-hidden pt-20">
      {/* Interactive ambient particles */}
      <ParticlesBackground />

      {/* Volumetric Radial Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full pointer-events-none bg-[#D9AC63]/10 blur-[100px] -z-10" />
      <div className="absolute top-[600px] right-[-100px] w-[300px] h-[300px] rounded-full pointer-events-none bg-[#FFD78A]/10 blur-[90px] -z-10" />

      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative z-10 px-4 pt-6 pb-12 flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Department Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#15100C]/90 border border-[#D9AC63]/30 shadow-gold mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD78A]" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#FFD78A]">
            Department of AI & DS Presents
          </span>
        </div>

        {/* Script Motto */}
        <p className="font-serif italic text-base sm:text-lg text-[#FFD78A] tracking-wide mb-2">
          New Friends • New Vibes • New Beginnings
        </p>

        {/* Grand Metallic Title */}
        <div className="relative flex flex-col items-center my-2">
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight gold-text-gradient drop-shadow-[0_4px_24px_rgba(217,172,99,0.4)]">
            AAGAZZ
          </h1>
          <span className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#FFD78A] -mt-2 tracking-widest drop-shadow-[0_2px_12px_rgba(217,172,99,0.5)]">
            2K26
          </span>
        </div>

        {/* Subtitle Calligraphy */}
        <p className="font-serif italic text-base sm:text-xl text-[#F8F2E8]/90 max-w-md mt-2">
          “Where Minds Connect and Futures Begin.”
        </p>

        <p className="text-xs uppercase tracking-[0.25em] text-[#D9AC63] font-semibold mt-1">
          Explore • Innovate • Excel with AI
        </p>

        {/* Official Date Plaque */}
        <div className="mt-6 w-full max-w-sm p-[1px] rounded-2xl bg-gradient-to-r from-transparent via-[#D9AC63] to-transparent shadow-2xl">
          <div className="bg-[#15100C]/95 backdrop-blur-md px-6 py-4 rounded-2xl flex flex-col items-center">
            <span className="text-[10px] font-bold text-[#D9AC63] tracking-[0.25em] uppercase">
              ✦ OFFICIAL EVENT SCHEDULE ✦
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="w-5 h-5 text-[#FFD78A]" />
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#FFD78A] tracking-wider">
                20 November 2026
              </span>
            </div>
            <p className="text-xs text-[#B9ADA0] mt-1 font-medium">
              10:00 AM – 2:00 PM • Auditorium C102, AI & DS Dept
            </p>
          </div>
        </div>

        {/* Live Champagne Countdown Clock */}
        <div className="mt-8 w-full flex justify-center">
          <Countdown />
        </div>

        {/* 3D Tactile Action CTA Suite */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md mt-8">
          <Link
            to="/register"
            className="btn-gold-3d w-full py-4 px-6 rounded-xl text-center uppercase tracking-wider text-sm flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
            <span>GET MY FOOD COUPON</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#highlights"
            className="btn-dark-metallic w-full py-3.5 px-6 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>EXPLORE EVENT</span>
          </a>
        </div>
      </section>

      {/* 2. OFFICIAL POSTER SHOWCASE SECTION */}
      <section className="px-4 py-8 max-w-4xl mx-auto relative z-10">
        <div className="glass-luxury rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8 border border-[#D9AC63]/30">
          {/* Poster Image Preview */}
          <div className="relative group w-full md:w-1/2 max-w-xs cursor-pointer" onClick={() => setPosterModal(true)}>
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FFD78A] via-[#D9AC63] to-[#B88643] rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
            <div className="relative rounded-xl overflow-hidden border border-[#D9AC63]/50 shadow-2xl">
              <img
                src="/aagazz_poster.png"
                alt="Official AAGAZZ 2K26 Event Poster"
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="px-3 py-1.5 rounded-full bg-[#15100C]/90 text-[#FFD78A] text-xs font-semibold flex items-center gap-1.5 border border-[#D9AC63]/40">
                  <ExternalLink className="w-3.5 h-3.5" /> Click to Expand
                </span>
              </div>
            </div>
          </div>

          {/* Poster Description & Batch Welcome */}
          <div className="w-full md:w-1/2 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#221F1B] border border-[#D9AC63]/30 text-[#D9AC63] text-xs font-bold mb-3">
              <span>✦ S. S. EDUCATION TRUST ✦</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] mb-2">
              S. G. Balekundri Institute of Technology, Belagavi
            </h2>

            <p className="text-sm text-[#FFD78A] font-semibold mb-2">
              Welcoming the Fresh Minds of Batch 2025–29
            </p>

            <p className="text-xs sm:text-sm text-[#B9ADA0] leading-relaxed mb-4">
              The Department of Artificial Intelligence and Data Science warmly invites all first-year
              students to AAGAZZ 2K26. Claim your digital coupon now to enjoy complimentary dining at the banquet counter!
            </p>

            <div className="flex flex-col gap-2 w-full pt-2">
              <div className="flex items-center gap-2 text-xs text-[#F8F2E8]">
                <CheckCircle2 className="w-4 h-4 text-[#D9AC63]" />
                <span>Strictly Whitelisted AI & DS Department Students</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#F8F2E8]">
                <CheckCircle2 className="w-4 h-4 text-[#D9AC63]" />
                <span>1 Digital Food Coupon per Eligible USN</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#F8F2E8]">
                <CheckCircle2 className="w-4 h-4 text-[#D9AC63]" />
                <span>Encrypted QR Verification for Seamless Entry</span>
              </div>
            </div>

            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD78A] to-[#D9AC63] text-[#080604] font-bold text-xs uppercase tracking-wider shadow-gold"
            >
              <span>Verify USN & Claim Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 2x2 INFORMATION MATRIX */}
      <section className="px-4 py-8 max-w-4xl mx-auto relative z-10" id="highlights">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold text-[#FFD78A] tracking-[0.2em] uppercase">
            ✦ Key Event Coordinates ✦
          </span>
          <span className="text-xs text-[#B9ADA0]">Live Venue Data</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#15100C]/90 border border-[#D9AC63]/25 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-[#221F1B] flex items-center justify-center text-[#FFD78A] mb-2 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase text-[#B9ADA0] font-semibold">Date</span>
            <span className="font-serif text-lg font-bold text-[#F8F2E8] mt-0.5">20 Nov 2026</span>
            <span className="text-[11px] text-[#D9AC63] mt-0.5">Friday Gala</span>
          </div>

          <div className="bg-[#15100C]/90 border border-[#D9AC63]/25 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-[#221F1B] flex items-center justify-center text-[#FFD78A] mb-2 shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase text-[#B9ADA0] font-semibold">Time</span>
            <span className="font-serif text-lg font-bold text-[#F8F2E8] mt-0.5">10:00 AM</span>
            <span className="text-[11px] text-[#D9AC63] mt-0.5">Sharp to 2:00 PM</span>
          </div>

          <div className="bg-[#15100C]/90 border border-[#D9AC63]/25 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-[#221F1B] flex items-center justify-center text-[#FFD78A] mb-2 shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase text-[#B9ADA0] font-semibold">Venue</span>
            <span className="font-serif text-lg font-bold text-[#F8F2E8] mt-0.5">C102 Aud.</span>
            <span className="text-[11px] text-[#D9AC63] mt-0.5">AI & DS Dept Complex</span>
          </div>

          <div className="bg-[#15100C]/90 border border-[#D9AC63]/25 rounded-xl p-4 flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 rounded-lg bg-[#221F1B] flex items-center justify-center text-[#FFD78A] mb-2 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase text-[#B9ADA0] font-semibold">Honored Batch</span>
            <span className="font-serif text-lg font-bold text-[#F8F2E8] mt-0.5">2025–29</span>
            <span className="text-[11px] text-[#D9AC63] mt-0.5">AI & DS Engineers</span>
          </div>
        </div>
      </section>

      {/* 4. FOUR PILLARS OF CELEBRATION */}
      <section className="px-4 py-10 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold text-[#FFD78A] tracking-[0.25em] uppercase">
            ✦ Experience The Energy ✦
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] mt-1">
            Four Pillars of Celebration
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="bg-[#15100C]/80 border border-[#D9AC63]/20 rounded-2xl p-5 flex flex-col items-center text-center shadow-lg hover:border-[#D9AC63]/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#221F1B] flex items-center justify-center text-[#FFD78A] mb-3 shadow-[0_0_15px_rgba(217,172,99,0.2)]">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#FFD78A] mb-1">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#B9ADA0] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. HONORED DIGNITARIES SECTION */}
      <section className="px-4 py-10 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold text-[#FFD78A] tracking-[0.25em] uppercase">
            ✦ Patronage & Leadership ✦
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F8F2E8] mt-1">
            Distinguished Dignitaries
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dignitaries.map((dig) => (
            <div
              key={dig.name}
              className="bg-[#15100C]/90 border border-[#D9AC63]/25 rounded-2xl p-5 flex items-start gap-4 shadow-lg"
            >
              <div className="w-12 h-12 rounded-full bg-[#221F1B] border border-[#D9AC63]/40 flex items-center justify-center text-[#FFD78A] flex-shrink-0 shadow-gold">
                <span className="material-symbols-outlined text-[24px] text-[#FFD78A]">
                  {dig.icon}
                </span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-lg font-bold text-[#F8F2E8] leading-snug">
                  {dig.name}
                </span>
                <span className="text-xs font-semibold text-[#FFD78A] mt-0.5">
                  {dig.role} • {dig.title}
                </span>
                <p className="text-xs text-[#B9ADA0] mt-1 leading-relaxed">
                  {dig.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Poster Lightbox Modal */}
      {posterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPosterModal(false)}
        >
          <div className="relative max-w-lg max-h-[90vh] overflow-hidden rounded-2xl border border-[#D9AC63]">
            <img
              src="/aagazz_poster.png"
              alt="Official AAGAZZ 2K26 Event Poster Full View"
              className="w-full h-auto object-contain max-h-[85vh]"
            />
            <button
              onClick={() => setPosterModal(false)}
              className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#15100C]/90 text-[#FFD78A] text-xs font-bold border border-[#D9AC63]"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
