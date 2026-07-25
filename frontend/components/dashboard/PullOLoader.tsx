"use client";

/**
 * PullOLoader
 * ------------
 * Ports the ink-draw / ignition / non-repeating idle loader to React.
 *
 * Requirements:
 *   npm install gsap
 *
 * Setup:
 *   1. Put your raw PullO mark at /public/pullo-logo.svg (the plain white
 *      779-path SVG — fill/stroke on the paths themselves doesn't matter,
 *      this component overrides them).
 *   2. <PullOLoader /> anywhere. It fetches the SVG client-side, reads the
 *      real path geometry (getTotalLength / getBBox) the same way the
 *      HTML prototype did, and runs the full sequence:
 *      anticipation blur -> edge packets converge & absorb into the
 *      nearest real paths -> outline draws -> outline glows -> fill
 *      spreads -> cyan ignition flash -> one physical sweep -> settles
 *      into a NON-repeating idle state machine (irregular pulses /
 *      packets / silence, never the same rhythm twice).
 *
 * Two modes:
 *   - Autoplay (default): omit `progress`, the intro plays on its own timer.
 *   - Controlled: pass `progress` (0-100). The draw/glow/fill/ignite/sweep
 *     sequence is scrubbed directly to that value instead of playing on a
 *     timer — 20% progress = intro timeline sitting at its 20% mark. Once
 *     progress reaches 100 the idle state machine takes over automatically.
 *
 * Usage:
 *   <PullOLoader size={250} onComplete={() => setReady(true)} />
 *   <PullOLoader size={200} progress={loadPercent} />
 */

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import styles from "./PullOLoader.module.css";

interface PullOLoaderProps {
  /** Path to the raw PullO mark SVG. Defaults to /pullo-logo.svg */
  svgUrl?: string;
  /** Rendered size (px) of the logo itself. The scene around it scales with it. */
  size?: number;
  /** Fires once after the intro sequence finishes and idle begins. */
  onComplete?: () => void;
  className?: string;
  /**
   * Optional 0-100 loading progress. When provided, the intro animation
   * (blur -> draw -> glow -> fill -> ignite -> sweep) is driven directly by
   * this value instead of autoplaying on a timer. Update it as your real
   * load progresses; the logo fills in lockstep. Omit for autoplay.
   */
  progress?: number;
}

export default function PullOLoader({
  svgUrl = "/pullo-logo.svg",
  size = 250,
  onComplete,
  className,
  progress,
}: PullOLoaderProps) {
  const uid = useId().replace(/[:]/g, "");
  const gradId = `pulloGradient-${uid}`;
  const strokeGradId = `strokeGradient-${uid}`;
  const pulseBandId = `pulseBandGrad-${uid}`;
  const pulseMaskId = `pulseMaskEl-${uid}`;
  const pulseBlurId = `pulseBlur-${uid}`;
  const grainId = `grainFilter-${uid}`;

  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const igniteRef = useRef<HTMLDivElement>(null);
  const inkGroupRef = useRef<SVGGElement>(null);
  const pulseGroupRef = useRef<SVGGElement>(null);
  const pulseRectRef = useRef<SVGRectElement>(null);

  // Holds the intro timeline once built, and the latest `progress` value,
  // so the scrubbing effect below can reach it regardless of render timing.
  const introTlRef = useRef<gsap.core.Timeline | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
    const tl = introTlRef.current;
    if (tl && progress !== undefined) {
      tl.progress(Math.min(100, Math.max(0, progress)) / 100);
    }
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    const cleanupFns: Array<() => void> = [];

    async function init() {
      const res = await fetch(svgUrl);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const pathEls = Array.from(doc.querySelectorAll("path"));
      const markup = pathEls
        .map((p) => {
          const d = p.getAttribute("d") ?? "";
          const transform = p.getAttribute("transform");
          return transform
            ? `<path d="${d}" transform="${transform}"/>`
            : `<path d="${d}"/>`;
        })
        .join("");

      if (cancelled) return;
      if (inkGroupRef.current) inkGroupRef.current.innerHTML = markup;
      if (pulseGroupRef.current) pulseGroupRef.current.innerHTML = markup;

      requestAnimationFrame(() => {
        if (!cancelled) runAnimation();
      });
    }

    function runAnimation() {
      if (!inkGroupRef.current || !stageRef.current) return;

      const paths = Array.from(
        inkGroupRef.current.querySelectorAll("path")
      ) as SVGPathElement[];
      const count = paths.length;
      if (count === 0) return;

      const meta = paths.map((p) => {
        const len = p.getTotalLength();
        const bb = p.getBBox();
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        p.style.fill = "none";
        p.style.opacity = "0";

        // getBBox() ignores the element's own transform attribute, so
        // fold in any translate(x,y) to get the path's real center.
        let tx = 0;
        let ty = 0;
        const transformAttr = p.getAttribute("transform");
        if (transformAttr) {
          const m = transformAttr.match(
            /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/
          );
          if (m) {
            tx = parseFloat(m[1]);
            ty = parseFloat(m[2]);
          }
        }

        return {
          el: p,
          cx: bb.x + bb.width / 2 + tx,
          cy: bb.y + bb.height / 2 + ty,
        };
      });

      const SVG_SCALE = 600 / size;

      function nearestPaths(svgX: number, svgY: number, k: number) {
        return meta
          .map((m) => ({
            el: m.el,
            d: (m.cx - svgX) ** 2 + (m.cy - svgY) ** 2,
          }))
          .sort((a, b) => a.d - b.d)
          .slice(0, k)
          .map((o) => o.el);
      }

      // ---- restrained cursor parallax ----
      const tilt = tiltRef.current!;
      const qx = gsap.quickTo(tilt, "rotationY", { duration: 0.7, ease: "power3.out" });
      const qy = gsap.quickTo(tilt, "rotationX", { duration: 0.7, ease: "power3.out" });
      const onMouseMove = (e: MouseEvent) => {
        const r = stageRef.current!.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - 0.5;
        const my = (e.clientY - r.top) / r.height - 0.5;
        qx(mx * 10);
        qy(my * -10);
      };
      window.addEventListener("mousemove", onMouseMove);
      cleanupFns.push(() => window.removeEventListener("mousemove", onMouseMove));

      // ---- a packet: spawns from a random edge, accelerates in, and is
      // absorbed into the nearest real paths of the logo, which glow ----
      function spawnPacket(delay: number) {
        const edge = Math.floor(Math.random() * 4);
        const span = size * 0.84;
        let sx = 0,
          sy = 0;
        if (edge === 0) {
          sx = -span;
          sy = (Math.random() - 0.5) * span * 2;
        } else if (edge === 1) {
          sx = span;
          sy = (Math.random() - 0.5) * span * 2;
        } else if (edge === 2) {
          sx = (Math.random() - 0.5) * span * 2;
          sy = -span;
        } else {
          sx = (Math.random() - 0.5) * span * 2;
          sy = span;
        }

        const targetAngle = Math.random() * Math.PI * 2;
        const targetDist = size * (0.16 + Math.random() * 0.28);
        const tx = Math.cos(targetAngle) * targetDist;
        const ty = Math.sin(targetAngle) * targetDist;

        const p = document.createElement("div");
        p.className = styles.packet;
        fxRef.current?.appendChild(p);
        gsap.set(p, { x: sx, y: sy, opacity: 0 });
        gsap.to(p, { opacity: 1, duration: 0.1, delay });
        gsap.to(p, {
          x: tx,
          y: ty,
          duration: 0.35,
          delay,
          ease: "power4.in",
          onComplete: () => {
            if (!fxRef.current) return;
            p.remove();

            const ripple = document.createElement("div");
            ripple.className = styles.ripple;
            ripple.style.left = `calc(50% + ${tx}px)`;
            ripple.style.top = `calc(50% + ${ty}px)`;
            fxRef.current.appendChild(ripple);
            gsap.fromTo(
              ripple,
              { opacity: 0.9, scale: 0.4 },
              {
                opacity: 0,
                scale: 2.6,
                duration: 0.25,
                ease: "power2.out",
                onComplete: () => {
                  if (fxRef.current) ripple.remove();
                },
              }
            );

            const svgX = 300 + tx * SVG_SCALE;
            const svgY = 279.5 + ty * SVG_SCALE;
            const hit = nearestPaths(svgX, svgY, 5);
            gsap.fromTo(
              hit,
              { filter: "drop-shadow(0 0 0px rgba(255,255,255,0))" },
              {
                filter: "drop-shadow(0 0 9px rgba(255,255,255,.95))",
                duration: 0.15,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
              }
            );
          },
        });
      }

      function runPulse() {
        const sub = gsap.timeline();
        sub.set(pulseGroupRef.current, { opacity: 1 });
        sub.fromTo(
          pulseRectRef.current,
          { attr: { x: -360 } },
          { attr: { x: 480 }, duration: 0.4, ease: "power2.inOut" },
          0
        );
        sub.fromTo(
          bloomRef.current,
          { opacity: 0 },
          {
            opacity: 0.5,
            duration: 0.2,
            ease: "power1.out",
            background: "radial-gradient(circle, rgba(168,85,247,.55), transparent 70%)",
          },
          0.06
        );
        sub.to(bloomRef.current, { opacity: 0, duration: 0.2, ease: "power1.in" }, 0.22);
        sub.to(pulseGroupRef.current, { opacity: 0, duration: 0.12 }, "-=0.05");
        return sub;
      }

      // ---- non-repeating idle state machine: never the same rhythm twice ----
      let stopped = false;
      function stateMachine() {
        if (stopped) return;
        const roll = Math.random();
        const wait = 3.2 + Math.random() * 3.4;
        const dc = gsap.delayedCall(wait, () => {
          if (roll < 0.4) {
            runPulse();
          } else if (roll < 0.75) {
            spawnPacket(0);
          } else if (roll < 0.92) {
            spawnPacket(0);
            gsap.delayedCall(0.3 + Math.random() * 0.3, () => runPulse());
          }
          // else: a quiet beat — silence is part of the rhythm
          stateMachine();
        });
        cleanupFns.push(() => dc.kill());
      }

      const controlled = progressRef.current !== undefined;

      const tl = gsap.timeline({ delay: 0, paused: controlled });
      introTlRef.current = tl;
      cleanupFns.push(() => {
        introTlRef.current = null;
        tl.kill();
      });

      // Phase 0 — anticipation: blur overshoots before settling (fast)
      tl.set(logoWrapRef.current, { filter: "blur(12px)" });
      tl.to(logoWrapRef.current, { filter: "blur(18px)", duration: 0.15, ease: "power1.in" }, 0);
      tl.to(logoWrapRef.current, { filter: "blur(6px)", duration: 0.15, ease: "power2.out" }, 0.15);
      tl.to(logoWrapRef.current, { filter: "blur(0px)", duration: 0.15, ease: "power2.out" }, 0.3);

      // packets converge during the anticipation/build window, from real
      // edges — only in autoplay mode, since these run as independent
      // real-time tweens outside `tl` and can't be scrubbed by progress.
      if (!controlled) {
        for (let i = 0; i < 6; i++) spawnPacket(0.02 * i);
      }

      // Phase 1 — outline draws, single deliberate pass.
      // NOTE: with `count` in the hundreds, stagger's cumulative delay
      // (each * count) approaches the budget below regardless of count,
      // so effective duration ≈ duration + budget. Budgets are sized
      // accordingly to land on the target absolute times.
      tl.to(
        paths,
        {
          opacity: 1,
          strokeDashoffset: 0,
          duration: 0.15,
          ease: "power2.out",
          stagger: { each: 0.15 / count, from: "start" },
        },
        0.3
      );

      // Phase 1.5 — outline glows briefly before it fills
      tl.to(
        paths,
        { filter: "drop-shadow(0 0 5px rgba(255,255,255,.9))", duration: 0.08, ease: "power1.out" },
        0.55
      );

      // Phase 2 — fill spreads (fully filled by ~0.9s)
      tl.to(
        paths,
        {
          fill: `url(#${gradId})`,
          fillOpacity: 1,
          strokeOpacity: 0,
          duration: 0.15,
          ease: "power2.out",
          stagger: { each: 0.15 / count, from: "random" },
        },
        0.58
      );
      tl.to(paths, { filter: "none", duration: 0.1 }, 0.78);

      tl.to(logoWrapRef.current, { scale: 1.03, duration: 0.08, ease: "power2.out" }, 0.6);
      tl.to(logoWrapRef.current, { scale: 1, duration: 0.15, ease: "back.out(1.6)" }, 0.66);

      // ---- the one hero moment: brief cyan electrical ignition ----
      tl.to(igniteRef.current, { opacity: 0.85, duration: 0.03, ease: "power1.out" }, 0.6);
      tl.to(igniteRef.current, { opacity: 0, duration: 0.06, ease: "power2.out" }, 0.63);

      // Phase 3 — one physical, feathered/bloomed sweep, then it's done
      tl.add(runPulse(), 0.95);

      // Phase 4 — settle: static glow only, no idle breathing
      tl.set(logoWrapRef.current, { filter: "drop-shadow(0 0 8px rgba(168,85,247,.40))" }, "+=0");

      tl.call(() => {
        onComplete?.();
        stateMachine();
      });

      if (controlled) {
        tl.progress(
          Math.min(100, Math.max(0, progressRef.current ?? 0)) / 100
        );
      }

      cleanupFns.push(() => {
        stopped = true;
      });
    }

    init();

    return () => {
      cancelled = true;
      cleanupFns.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgUrl, size, uid]);

  const stageSize = Math.round(size * 1.84);

  return (
    <div
      className={`${styles.stage} ${className ?? ""}`}
      ref={stageRef}
      style={{ width: stageSize, height: stageSize }}
    >
      <div className={styles.camera}>
        <div className={styles.aurora} />
        <div className={styles.backdrop} />
        <div className={styles.fx} ref={fxRef} />
        <div className={styles.igniteFlash} ref={igniteRef} />

        <svg width="0" height="0">
          <filter id={grainId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
          </filter>
        </svg>
        <div className={styles.grain} style={{ filter: `url(#${grainId})` }} />

        <div className={styles.tiltWrap} ref={tiltRef} style={{ width: size, height: size }}>
          <div className={styles.bloomBehind} ref={bloomRef} />
          <div className={styles.logoWrap} ref={logoWrapRef}>
            <svg className={styles.logoSvg} viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id={strokeGradId} x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#CBD5E1" />
                </linearGradient>

                <linearGradient id={pulseBandId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
                  <stop offset="45%" stopColor="#C084FC" stopOpacity={0} />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity={0.95} />
                  <stop offset="55%" stopColor="#C084FC" stopOpacity={0} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <mask id={pulseMaskId}>
                  <rect
                    ref={pulseRectRef}
                    x={-360}
                    y={-340}
                    width={220}
                    height={980}
                    fill={`url(#${pulseBandId})`}
                    transform="rotate(16)"
                    filter={`url(#${pulseBlurId})`}
                  />
                </mask>
                <filter id={pulseBlurId} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="14" />
                </filter>
              </defs>

              <g
                ref={inkGroupRef}
                fill="none"
                stroke={`url(#${strokeGradId})`}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <g ref={pulseGroupRef} mask={`url(#${pulseMaskId})`} style={{ mixBlendMode: "screen", opacity: 0 }} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}