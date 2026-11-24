import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Match } from '../components/Print';
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

  const verdict = result && {
    SUCCESS: { kind: 'good', title: 'Serve one meal', text: '', next: 'Scan the next student' },
    ALREADY_REDEEMED: { kind: 'warn', title: 'Already eaten', text: 'This coupon was used before. Do not serve.', next: 'Scan the next student' },
    REVOKED: { kind: 'bad', title: 'Do not serve', text: result.message, next: 'Scan the next student' },
    NOT_FOUND: { kind: 'bad', title: 'Not a valid coupon', text: result.message, next: 'Try again' },
  }[result.status];

  return (
    <div className="scan">
      {result && verdict && (
        <div className={`verdict verdict--${verdict.kind}`} role="alert">
          <Match state={verdict.kind === 'good' ? 'lit' : 'burnt'} />
          <h2>{verdict.title}</h2>
          {verdict.text && <p>{verdict.text}</p>}
          {result.student_name && (
            <dl>
              <div><dt>Student</dt><dd>{result.student_name}</dd></div>
              {result.usn && <div><dt>USN</dt><dd>{result.usn}</dd></div>}
              {result.coupon_code && <div><dt>Coupon</dt><dd>{result.coupon_code}</dd></div>}
              {result.volunteer_name && <div><dt>{result.status === 'ALREADY_REDEEMED' ? 'First scanned by' : 'Scanned by'}</dt><dd>{result.volunteer_name}</dd></div>}
            </dl>
          )}
          <button onClick={dismissResult} className="btn btn--wide" autoFocus>{verdict.next}</button>
        </div>
      )}

      <header className="head">
        <h1>Scan</h1>
        <p className="scan__count"><b>{todayCount}</b> scanned by you</p>
      </header>

      <div className="finder">
        <div id="qr-reader" />
        {!isScanning && (
          <div className="finder__idle">
            <button onClick={startScanner} className="btn btn--red">Start camera</button>
            <p>Point it at the QR on the student's pass.</p>
          </div>
        )}
      </div>
      {isScanning && (
        <div className="row">
          <button onClick={toggleTorch} className="btn" aria-pressed={torchOn}>{torchOn ? 'Torch off' : 'Torch on'}</button>
          <button onClick={stopScanner} className="btn">Stop camera</button>
        </div>
      )}

      <form onSubmit={handleManualRedeem} className="manual">
        <div className="field">
          <label htmlFor="code">Or type the coupon code</label>
          <input id="code" type="text" placeholder="FC-AAGAZZ-2026-X9A2" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} autoCapitalize="characters" spellCheck={false} />
        </div>
        <button type="submit" disabled={loading || !manualCode.trim()} className="btn btn--red">{loading ? 'Checking' : 'Redeem'}</button>
      </form>

      <section>
        <h2>Your recent scans</h2>
        {scanHistory.length === 0 ? (
          <p className="none">Nothing yet. Your scans will be listed here.</p>
        ) : (
          <div className="scroll scroll--short">
            <table className="ledger">
              <tbody>
                {scanHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.student_name}</td>
                    <td className="code">{item.usn}</td>
                    <td className="num">{new Date(item.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
