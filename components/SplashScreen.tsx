'use client';

import React, { useEffect, useState } from 'react';

/**
 * Animated splash screen shown once per browser session when the app
 * first loads. The Mr.FLENS / Stock-Lens artwork zooms and fades in,
 * pulses with a neon glow, then fades out to reveal the app.
 */
export default function SplashScreen() {
  // `mounted` controls whether the overlay is in the DOM at all.
  // `leaving` triggers the fade-out CSS once we begin dismissing.
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // If we've already shown the splash this session, skip it so it
    // doesn't get in the way during in-app navigations / refreshes.
    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem('stocklens.splashShown') === '1';
    } catch {
      // ignore (e.g. private mode)
    }

    if (alreadyShown) {
      setMounted(false);
      return;
    }

    // Allow user to dismiss early with click / key press / scroll.
    const beginLeave = () => setLeaving(true);

    const startTimer = window.setTimeout(beginLeave, 2400);
    const endTimer = window.setTimeout(() => {
      setMounted(false);
      try {
        window.sessionStorage.setItem('stocklens.splashShown', '1');
      } catch {
        // ignore
      }
    }, 3200);

    window.addEventListener('click', beginLeave);
    window.addEventListener('keydown', beginLeave);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
      window.removeEventListener('click', beginLeave);
      window.removeEventListener('keydown', beginLeave);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`splash-root ${leaving ? 'splash-leaving' : ''}`}
    >
      <div className="splash-bg" />
      <div className="splash-ring" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash.jpg"
        alt="Mr.FLENS Stock-Lens"
        className="splash-image"
      />
      <div className="splash-shine" />
    </div>
  );
}
