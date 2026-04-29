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

    // Allow user to dismiss early with click / Escape / Enter / Space.
    let endTimer = 0;
    const finish = () => {
      setMounted(false);
      try {
        window.sessionStorage.setItem('stocklens.splashShown', '1');
      } catch {
        // ignore
      }
    };
    const beginLeave = () => {
      setLeaving((wasLeaving) => {
        if (!wasLeaving) {
          // Reset the unmount timer so it fires after the fade-out
          // animation (~0.8s) regardless of when dismissal started.
          window.clearTimeout(endTimer);
          endTimer = window.setTimeout(finish, 850);
        }
        return true;
      });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        beginLeave();
      }
    };

    const startTimer = window.setTimeout(beginLeave, 2400);
    endTimer = window.setTimeout(finish, 3200);

    window.addEventListener('click', beginLeave);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(endTimer);
      window.removeEventListener('click', beginLeave);
      window.removeEventListener('keydown', onKeyDown);
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
