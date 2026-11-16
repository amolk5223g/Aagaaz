import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  Flashlight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  QrCode,
  Keyboard,
  History
} from 'lucide-react';
import { api } from '../services/api';
import type { ScannerRedemptionResult } from '../types';

export const QrScannerPage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScannerRedemptionResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API for sound feedback
  const playSound = (type: 'SUCCESS' | 'ERROR') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'SUCCESS') {
        // Pleasant cheerful chord (E5 -> B5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Buzz tone (low sawtooth)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio not permitted or supported
    }
  };

  const loadVolunteerStats = async () => {
    try {
      const stats = await api.getVolunteerStats();
      setTodayCount(stats.total_scanned);
      const history = await api.getVolunteerRedemptions();
      setScanHistory(history);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVolunteerStats();
    return () => {
      stopScanner();
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    // Pause scanner during redemption processing
    if (loading) return;
    setLoading(true);

    try {
      const res = await api.redeemCoupon(decodedText.trim());
      setResult(res);

      if (res.status === 'SUCCESS') {
        playSound('SUCCESS');
        loadVolunteerStats();
      } else {
        playSound('ERROR');
      }
    } catch (err: any) {
      setResult({
        success: false,
        status: 'NOT_FOUND',
        message: err.message || 'Scanned coupon could not be processed.',
      });
      playSound('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setResult(null);
    try {
      const qrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = qrCode;

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      alert('Camera access denied or device has no camera. You can also use Manual Entry below.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error(e);
      }
      setIsScanning(false);
      setTorchOn(false);
    }
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        const next = !torchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: next } as any],
        });
        setTorchOn(next);
      } catch (e) {
        alert('Flashlight control is not supported on this device/browser.');
      }
    }
  };

  const handleManualRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    setLoading(true);
    try {
      const res = await api.redeemCoupon(manualCode.trim().toUpperCase());
      setResult(res);
      setManualCode('');
      if (res.status === 'SUCCESS') {
        playSound('SUCCESS');
        loadVolunteerStats();
      } else {
        playSound('ERROR');
      }
    } catch (err: any) {
      setResult({
        success: false,
        status: 'NOT_FOUND',
        message: err.message || 'Manual coupon code not found.',
      });
      playSound('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const dismissResult = () => {
    setResult(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#15100C] border border-emerald-500/40 text-emerald-400 text-xs font-bold mb-2 shadow-inner">
          <QrCode className="w-3.5 h-3.5" />
          <span className="uppercase tracking-[0.2em]">FOOD VERIFICATION STATION</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-[#F8F2E8]">
          AAGAZZ 2K26 Scanner
        </h1>
        <p className="text-[11px] text-[#B9ADA0]">
          Banquet Counter C102 • Scanned by you today: <strong className="text-[#FFD78A]">{todayCount}</strong>
        </p>
      </div>

      {/* FULL-SCREEN RESULT MODAL / OVERLAY */}
      {result && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          {/* SUCCESS SCREEN */}
          {result.status === 'SUCCESS' && (
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0A2616] to-[#05140B] border-2 border-emerald-400 p-6 text-center shadow-[0_0_50px_rgba(52,211,153,0.4)] animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-[#080604] flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(52,211,153,0.7)] animate-bounce">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>

              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-emerald-400">
                ✦ VALID COUPON ✦
              </span>

              <h2 className="font-serif text-2xl font-bold text-white mt-1 mb-1">
                FOOD COUPON REDEEMED
              </h2>

              <div className="bg-[#080604]/80 rounded-2xl p-4 my-4 border border-emerald-500/30 text-left space-y-2">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] block">Student Name</span>
                  <span className="font-serif text-lg font-bold text-white block">{result.student_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-950">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] block">USN</span>
                    <span className="font-mono text-sm font-bold text-emerald-400 block">{result.usn}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] block">Coupon ID</span>
                    <span className="font-mono text-sm font-bold text-[#FFD78A] block">{result.coupon_code}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-emerald-950 text-[10px] text-[#B9ADA0]">
                  Verified by: <strong className="text-emerald-300">{result.volunteer_name}</strong>
                </div>
              </div>

              <button
                onClick={dismissResult}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#080604] font-bold text-sm uppercase tracking-wider shadow-lg active:scale-95"
              >
                READY FOR NEXT SCAN
              </button>
            </div>
          )}

          {/* DUPLICATE SCREEN */}
          {result.status === 'ALREADY_REDEEMED' && (
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2E2005] to-[#171002] border-2 border-amber-400 p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.4)] animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-amber-400 text-[#080604] flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse">
                <AlertTriangle className="w-12 h-12 stroke-[2.5]" />
              </div>

              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-amber-400">
                ✦ DUPLICATE ATTEMPT ✦
              </span>

              <h2 className="font-serif text-2xl font-bold text-white mt-1 mb-1">
                ALREADY REDEEMED!
              </h2>

              <p className="text-xs text-amber-200 mb-4 font-semibold">
                This food coupon has already been used and cannot be claimed again.
              </p>

              <div className="bg-[#080604]/80 rounded-2xl p-4 my-4 border border-amber-500/30 text-left space-y-2">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] block">Student Name</span>
                  <span className="font-serif text-base font-bold text-white block">{result.student_name}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#B9ADA0] block">USN</span>
                  <span className="font-mono text-sm font-bold text-amber-400 block">{result.usn}</span>
                </div>
                {result.volunteer_name && (
                  <div className="pt-1 border-t border-amber-950 text-[10px] text-[#B9ADA0]">
                    Previous scan by: <strong className="text-amber-300">{result.volunteer_name}</strong>
                  </div>
                )}
              </div>

              <button
                onClick={dismissResult}
                className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#080604] font-bold text-sm uppercase tracking-wider active:scale-95"
              >
                DISMISS WARNING
              </button>
            </div>
          )}

          {/* INVALID / REVOKED SCREEN */}
          {(result.status === 'REVOKED' || result.status === 'NOT_FOUND') && (
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#2E0B0B] to-[#170505] border-2 border-red-500 p-6 text-center shadow-[0_0_50px_rgba(239,68,68,0.4)] animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(239,68,68,0.7)] animate-pulse">
                <XCircle className="w-12 h-12 stroke-[2.5]" />
              </div>

              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-red-400">
                ✦ ACCESS DENIED ✦
              </span>

              <h2 className="font-serif text-2xl font-bold text-white mt-1 mb-1">
                INVALID / REVOKED COUPON
              </h2>

              <p className="text-xs text-red-200 my-4 leading-relaxed">
                {result.message}
              </p>

              <button
                onClick={dismissResult}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-wider active:scale-95"
              >
                DISMISS
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Scanner Container */}
      <div className="glass-luxury rounded-2xl p-4 border border-[#D9AC63]/30 shadow-2xl overflow-hidden">
        {/* Scanner Viewfinder Box */}
        <div className="relative w-full aspect-square bg-[#080604] rounded-xl overflow-hidden border border-[#D9AC63]/40 flex flex-col items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#080604]/90 z-10">
              <div className="w-16 h-16 rounded-full bg-[#15100C] border border-[#D9AC63]/40 flex items-center justify-center text-[#FFD78A] mb-3 shadow-gold">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#F8F2E8]">
                Camera Ready
              </h3>
              <p className="text-xs text-[#B9ADA0] mt-1 max-w-xs mb-4">
                Click below to start the camera and scan the student's digital food coupon.
              </p>

              <button
                onClick={startScanner}
                className="btn-gold-3d px-6 py-3 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center gap-2 shadow-gold"
              >
                <Camera className="w-4 h-4" />
                <span>ACTIVATE CAMERA</span>
              </button>
            </div>
          )}

          {/* Flashlight toggle when scanning */}
          {isScanning && (
            <button
              onClick={toggleTorch}
              className={`absolute top-3 right-3 z-20 p-2.5 rounded-full border shadow-lg transition-all ${
                torchOn
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                  : 'bg-[#15100C]/80 text-[#FFD78A] border-[#D9AC63]/40'
              }`}
              title="Toggle Flashlight"
            >
              <Flashlight className="w-5 h-5" />
            </button>
          )}

          {isScanning && (
            <button
              onClick={stopScanner}
              className="absolute bottom-3 z-20 px-4 py-1.5 rounded-full bg-red-950/80 text-red-300 border border-red-800 text-xs font-bold"
            >
              Stop Camera
            </button>
          )}
        </div>

        {/* Manual Coupon Code Input Fallback */}
        <div className="mt-4 pt-4 border-t border-[#D9AC63]/20">
          <span className="text-[10px] uppercase font-bold text-[#FFD78A] tracking-wider block mb-2 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual Coupon ID Entry</span>
          </span>

          <form onSubmit={handleManualRedeem} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. FC-AAGAZZ-2026-001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="flex-1 h-11 px-3 rounded-xl bg-[#080604] border border-[#D9AC63]/30 text-xs text-[#F8F2E8] font-mono focus:outline-none focus:border-[#FFD78A]"
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              className="btn-gold-3d px-4 h-11 rounded-xl text-xs uppercase font-bold disabled:opacity-40"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Redeem</span>}
            </button>
          </form>
        </div>
      </div>

      {/* Volunteer Recent Scan History */}
      <div className="glass-luxury rounded-2xl p-4 border border-[#D9AC63]/25">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase font-bold text-[#FFD78A] tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Your Recent Scans</span>
          </span>
          <span className="text-[11px] text-[#B9ADA0]">Total: {todayCount}</span>
        </div>

        {scanHistory.length === 0 ? (
          <p className="text-xs text-[#B9ADA0] text-center py-4">
            No scans performed yet. Point camera at student pass to begin.
          </p>
        ) : (
          <div className="divide-y divide-[#221F1B] max-h-48 overflow-y-auto">
            {scanHistory.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#F8F2E8] block">{item.student_name}</span>
                  <span className="text-[10px] text-[#FFD78A] font-mono">{item.usn} • {item.coupon_code}</span>
                </div>
                <span className="text-[10px] text-[#B9ADA0] font-mono">
                  {new Date(item.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
