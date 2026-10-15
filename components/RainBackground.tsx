/**
 * components/RainBackground.tsx
 * Rain-on-glass atmosphere, ONLY behind the Home hero.
 * - Video: public/rain.webm, public/rain.mp4 (owner's files), legacy public/hujan-loop.mp4 as
 *   last fallback; poster public/rain-poster.jpg. Missing files -> dark gradient.
 * - 6 soft bokeh circles (radial-gradient + mix-blend-mode: screen, slow drift, no blur filter).
 * - Fades to the plain background as you scroll past the hero (opacity tied to scroll).
 * - Video pauses when nearly invisible, when the tab is hidden, and under reduced motion
 *   (poster shown instead). The "Atmosfer" switch (Lainnya sheet) turns all of it off.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useAtmosphereEnabled, usePrefersReducedMotion } from "@/lib/atmosphere";

const BOKEH: { left: string; top: string; size: number; opacity: number; dx: string; dy: string; dur: number; tint: string }[] = [
  { left: "8%", top: "14%", size: 140, opacity: 0.22, dx: "18px", dy: "-12px", dur: 22, tint: "143, 163, 191" },
  { left: "72%", top: "8%", size: 190, opacity: 0.18, dx: "-22px", dy: "14px", dur: 28, tint: "242, 242, 238" },
  { left: "58%", top: "42%", size: 110, opacity: 0.26, dx: "14px", dy: "18px", dur: 19, tint: "143, 163, 191" },
  { left: "18%", top: "56%", size: 170, opacity: 0.15, dx: "-16px", dy: "-10px", dur: 26, tint: "242, 242, 238" },
  { left: "84%", top: "62%", size: 90, opacity: 0.3, dx: "-10px", dy: "-16px", dur: 17, tint: "143, 163, 191" },
  { left: "38%", top: "24%", size: 70, opacity: 0.2, dx: "12px", dy: "10px", dur: 21, tint: "242, 242, 238" },
];

export function RainBackground() {
  const enabled = useAtmosphereEnabled();
  const reduce = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  const showVideo = enabled && !reduce && !videoFailed;

  // Scroll-linked fade + pause/resume logic. Writes styles directly (no re-render per frame).
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;

    const update = () => {
      raf = 0;
      const height = root.offsetHeight || window.innerHeight;
      const opacity = Math.max(0, Math.min(1, 1 - window.scrollY / (height * 0.85)));
      root.style.opacity = String(opacity);
      root.style.visibility = opacity < 0.01 ? "hidden" : "visible";

      const video = videoRef.current;
      if (!video) return;
      const shouldPlay = opacity > 0.05 && !document.hidden;
      if (shouldPlay && video.paused) {
        video.muted = true;
        video.play().catch(() => {
          /* autoplay blocked: poster / gradient stays visible */
        });
      } else if (!shouldPlay && !video.paused) {
        video.pause();
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [enabled, showVideo]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} aria-hidden="true" className="rn-atmosphere">
      {/* Base layer: poster (if the owner added it) over a dark gradient */}
      <div className="rn-atmosphere-poster" />

      {showVideo && (
        <video
          ref={videoRef}
          className="rn-atmosphere-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/rain-poster.jpg"
          onError={() => setVideoFailed(true)}
        >
          <source src="/rain.webm" type="video/webm" />
          <source src="/rain.mp4" type="video/mp4" />
          {/* Legacy file already in the repo; remove once rain.webm/rain.mp4 exist */}
          <source src="/hujan-loop.mp4" type="video/mp4" onError={() => setVideoFailed(true)} />
        </video>
      )}

      {BOKEH.map((b, i) => (
        <span
          key={i}
          className="rn-bokeh"
          style={
            {
              left: b.left,
              top: b.top,
              width: b.size,
              height: b.size,
              opacity: b.opacity,
              animationDuration: `${b.dur}s`,
              background: `radial-gradient(circle, rgba(${b.tint}, 0.9) 0%, rgba(${b.tint}, 0.35) 38%, rgba(${b.tint}, 0) 70%)`,
              "--dx": b.dx,
              "--dy": b.dy,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Dark scrim for legibility + fade into the plain background at the bottom */}
      <div className="rn-atmosphere-scrim" />
    </div>
  );
}
