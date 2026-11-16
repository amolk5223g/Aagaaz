import React, { useState, useEffect } from 'react';
import { Hourglass } from 'lucide-react';

interface CountdownProps {
  targetDate?: string;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDate = '2026-11-20T10:00:00+05:30' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculate = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="w-full max-w-xs flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Hourglass className="w-4 h-4 text-[#FFD78A] animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-sans text-[11px] font-bold text-[#FFD78A] tracking-[0.2em] uppercase">
          Gala Commencement In
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full">
        <div className="bg-[#221F1B]/90 backdrop-blur-md rounded-xl py-2 px-1 flex flex-col items-center border border-[#D9AC63]/25 shadow-md">
          <span className="font-serif text-2xl font-bold text-[#FFD78A] leading-tight">
            {pad(timeLeft.days)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] mt-0.5 font-medium">
            Days
          </span>
        </div>

        <div className="bg-[#221F1B]/90 backdrop-blur-md rounded-xl py-2 px-1 flex flex-col items-center border border-[#D9AC63]/25 shadow-md">
          <span className="font-serif text-2xl font-bold text-[#FFD78A] leading-tight">
            {pad(timeLeft.hours)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] mt-0.5 font-medium">
            Hours
          </span>
        </div>

        <div className="bg-[#221F1B]/90 backdrop-blur-md rounded-xl py-2 px-1 flex flex-col items-center border border-[#D9AC63]/25 shadow-md">
          <span className="font-serif text-2xl font-bold text-[#FFD78A] leading-tight">
            {pad(timeLeft.minutes)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] mt-0.5 font-medium">
            Mins
          </span>
        </div>

        <div className="bg-[#221F1B]/90 backdrop-blur-md rounded-xl py-2 px-1 flex flex-col items-center border border-[#D9AC63]/25 shadow-md">
          <span className="font-serif text-2xl font-bold text-[#D9AC63] leading-tight">
            {pad(timeLeft.seconds)}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] mt-0.5 font-medium">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
};

