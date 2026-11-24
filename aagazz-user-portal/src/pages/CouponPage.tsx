import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { Match } from '../components/Print';
import { Ticket } from '../components/Ticket';
import { EVENT } from '../event';
import type { FoodCouponData } from '../types';

export const CouponPage: React.FC = () => {
  const [coupon, setCoupon] = useState<FoodCouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchCoupon = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMyCoupon();
      setCoupon(data);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Your coupon could not be loaded. Check your connection and refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupon();

    // Auto-poll every 6 seconds to reflect volunteer scan redemption in real time!
    const pollInterval = setInterval(() => {
      if (api.isAuthenticated()) {
        api.getCouponStatus().then((statusRes) => {
          if (statusRes.has_coupon && statusRes.status) {
            setCoupon((prev) => {
              if (prev && prev.status !== statusRes.status) {
                return {
                  ...prev,
                  status: statusRes.status as any,
                  redeemed_at: statusRes.redeemed_at,
                  volunteer_name: statusRes.volunteer_name,
                };
              }
              return prev;
            });
          }
        }).catch(() => {});
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = async () => {
    if (navigator.share && coupon) {
      try {
        await navigator.share({
          title: 'AAGAZZ 2K26 Food Coupon',
          text: `AAGAZZ 2K26 Official Food Coupon for ${coupon.student_name} (${coupon.usn})`,
          url: window.location.href,
        });
      } catch (e) {
        // user dismissed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied');
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <section className="pass pass--empty">
        <Match state="lit" />
        <p role="status">Getting your pass</p>
      </section>
    );
  }

  // Not authenticated / No coupon yet
  if (!api.isAuthenticated() || !coupon) {
    return (
      <section className="pass pass--empty">
        <Match state={errorMessage ? 'burnt' : 'fresh'} />
        <h1>Empty box</h1>
        <p>{errorMessage || 'Verify your USN and your food coupon will show up here.'}</p>
        <Link to="/register" className="plaque plaque--red">Get my food coupon</Link>
      </section>
    );
  }

  const isRedeemed = coupon.status === 'REDEEMED';
  const isRevoked = coupon.status === 'REVOKED';
  const redeemedTime = isRedeemed && coupon.redeemed_at
    ? new Date(coupon.redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="pass">
      {toastMessage && <p className="toast" role="status">{toastMessage}</p>}

      <div className="pass__copy">
        <h1>{isRedeemed ? 'Struck. Enjoy your meal.' : isRevoked ? 'This pass was revoked' : 'Come hungry'}</h1>
        <p>
          {isRedeemed
            ? `Your coupon was scanned${redeemedTime ? ` at ${redeemedTime}` : ''}. It can't be used again.`
            : isRevoked
              ? 'An organizer revoked this coupon. Ask a student coordinator for help.'
              : `Show this QR to the volunteer at counter ${EVENT.counter}. It works once.`}
        </p>
        <div className="pass__actions">
          <button onClick={handleDownload} className="plaque plaque--red">Print or save as PDF</button>
          <button onClick={handleShare} className="plaque plaque--ink">Share</button>
          <button onClick={fetchCoupon} className="plaque plaque--ink">Refresh</button>
        </div>
      </div>

      <Ticket
        name={coupon.student_name}
        usn={coupon.usn}
        code={coupon.coupon_code}
        status={isRedeemed ? `Redeemed${redeemedTime ? ` ${redeemedTime}` : ''}` : isRevoked ? 'Revoked' : 'Ready to use'}
        kind={isRedeemed ? 'redeemed' : isRevoked ? 'revoked' : 'active'}
      >
        <QRCodeSVG
          value={coupon.qr_token || coupon.coupon_code}
          size={200}
          level="H"
          fgColor="#000000"
          title="Food coupon QR code"
        />
      </Ticket>
    </section>
  );
};
