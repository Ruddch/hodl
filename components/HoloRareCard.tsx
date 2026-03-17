"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useRef } from "react";

// ── Rainbow colours for the holo stripes ───────────────────────────────────
const RAINBOW = `repeating-linear-gradient(110deg,
  hsl(0,100%,60%),
  hsl(55,100%,55%),
  hsl(130,100%,55%),
  hsl(210,100%,60%),
  hsl(270,100%,70%),
  hsl(0,100%,60%),
  hsl(55,100%,55%),
  hsl(130,100%,55%),
  hsl(210,100%,60%),
  hsl(270,100%,70%),
  hsl(0,100%,60%),
  hsl(55,100%,55%),
  hsl(130,100%,55%),
  hsl(210,100%,60%),
  hsl(270,100%,70%)
)`;

// Fine horizontal scanlines (2px black / 2px grey)
const SCANLINES = `repeating-linear-gradient(90deg,
  #000 0px, #000 2px,
  #666 2px, #666 4px
)`;

// Vertical bars pattern – two overlapping periods create Moiré beam effect
const BARS_1 = `repeating-linear-gradient(90deg,
  #000 6%,  #b2b2b2 9%,
  #000 10.5%, #b2b2b2 12%,
  #000 15%, #000 42%
)`;
const BARS_2 = `repeating-linear-gradient(90deg,
  #000 6%,  #b2b2b2 9%,
  #000 10.5%, #b2b2b2 12%,
  #000 15%, #000 30%
)`;

// ── Spring / LERP helpers ───────────────────────────────────────────────────
const LERP_T = 0.12;
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

type Spring = { rotX: number; rotY: number; px: number; py: number; opacity: number };

// ── Component ───────────────────────────────────────────────────────────────
interface HoloRareCardProps {
  children?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  tabIndex?: number;
  role?: React.AriaRole;
  className?: string;
  style?: CSSProperties;
  "data-ph-capture-attribute-button"?: string;
}

export function HoloRareCard({
  children,
  onClick,
  onKeyDown,
  tabIndex,
  role,
  className,
  style,
  "data-ph-capture-attribute-button": dataPhCapture,
}: HoloRareCardProps) {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const tiltRef       = useRef<HTMLDivElement>(null);
  const shineGroupRef = useRef<HTMLDivElement>(null);
  const shine1Ref     = useRef<HTMLDivElement>(null); // rainbow + scanlines
  const shine2Ref     = useRef<HTMLDivElement>(null); // vertical bars (::before)
  const shine3Ref     = useRef<HTMLDivElement>(null); // radial luminosity spot (::after)
  const glare1Ref     = useRef<HTMLDivElement>(null);
  const glare2Ref     = useRef<HTMLDivElement>(null);

  const curr = useRef<Spring>({ rotX: 0, rotY: 0, px: 50, py: 50, opacity: 0 });
  const targ = useRef<Spring>({ rotX: 0, rotY: 0, px: 50, py: 50, opacity: 0 });
  const rafRef    = useRef<number | null>(null);
  const hovering  = useRef(false);
  const animateRef = useRef<() => void>(() => {});

  const startRaf = useCallback(() => {
    if (rafRef.current === null) animateRef.current();
  }, []);

  const applyStyles = useCallback(() => {
    const c = curr.current;

    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${c.rotY}deg) rotateY(${c.rotX}deg)`;
    }

    if (shineGroupRef.current) {
      shineGroupRef.current.style.opacity = String(c.opacity);
    }

    // ── Shine 1: rainbow stripes + scanlines ──
    // Background-position shifts with cursor to cycle through the spectrum
    if (shine1Ref.current) {
      const posX = ((50 - c.px) * 2.6) + 50;
      const posY = ((50 - c.py) * 3.5) + 50;
      shine1Ref.current.style.backgroundPosition = `${posX}% ${posY}%, center`;
    }

    // ── Shine 2: vertical bars (Moiré beam) ──
    // Two independent layers shift in opposite directions creating the beam sweep
    if (shine2Ref.current) {
      const p1x = ((50 - c.px) * 1.65 + 50) + (c.py * 0.5);
      const p2x = ((50 - c.px) * -0.9 + 50) - (c.py * 0.75);
      shine2Ref.current.style.backgroundPosition = `${p1x}% ${c.px}%, ${p2x}% ${c.py}%`;
    }

    // ── Shine 3: subtle luminosity tint at cursor — kept dim to avoid white hotspot ──
    if (shine3Ref.current) {
      shine3Ref.current.style.backgroundImage = `radial-gradient(
        farthest-corner circle at ${c.px}% ${c.py}%,
        hsla(0,0%,90%,0.3) 0%,
        hsla(0,0%,60%,0.05) 30%,
        hsl(0,0%,0%) 85%
      )`;
    }

    // ── Glare layers ──
    if (glare1Ref.current) {
      glare1Ref.current.style.opacity = String(c.opacity * 0.65);
      glare1Ref.current.style.backgroundImage = `radial-gradient(farthest-corner circle at ${c.px}% ${c.py}%, rgba(255,255,255,0.55) 0%, transparent 70%)`;
    }
    if (glare2Ref.current) {
      glare2Ref.current.style.opacity = "0";
    }
  }, []);

  const animate = useCallback(() => {
    const c = curr.current;
    const g = targ.current;
    c.rotX    = lerp(c.rotX,    g.rotX,    LERP_T);
    c.rotY    = lerp(c.rotY,    g.rotY,    LERP_T);
    c.px      = lerp(c.px,      g.px,      LERP_T);
    c.py      = lerp(c.py,      g.py,      LERP_T);
    c.opacity = lerp(c.opacity, g.opacity, LERP_T);

    applyStyles();

    const settled =
      Math.abs(c.rotX - g.rotX) < 0.01 &&
      Math.abs(c.rotY - g.rotY) < 0.01 &&
      Math.abs(c.opacity - g.opacity) < 0.005;

    if (settled && !hovering.current) {
      rafRef.current = null;
    } else {
      rafRef.current = requestAnimationFrame(animateRef.current);
    }
  }, [applyStyles]);

  useEffect(() => { animateRef.current = animate; }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pfl  = (e.clientX - rect.left)  / rect.width;
    const pft  = (e.clientY - rect.top)   / rect.height;
    targ.current = {
      px:      pfl * 100,
      py:      pft * 100,
      rotX:   -(pfl - 0.5) * 30,
      rotY:    (pft - 0.5) * 30,
      opacity: 1,
    };
    startRaf();
  }, [startRaf]);

  const handleMouseEnter = useCallback(() => {
    hovering.current = true;
    startRaf();
  }, [startRaf]);

  const handleMouseLeave = useCallback(() => {
    hovering.current = false;
    targ.current = { rotX: 0, rotY: 0, px: 50, py: 50, opacity: 0 };
    startRaf();
  }, [startRaf]);

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const abs: CSSProperties = { position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none" };
  // Restrict holo layers to the artwork area only (top ~70%), exclude text/stats section
  const ARTWORK_CLIP = "inset(4px 4px 28% round 8px)";

  return (
    <div
      ref={wrapperRef}
      style={{ perspective: "600px" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      role={role}
      data-ph-capture-attribute-button={dataPhCapture}
    >
      <div
        ref={tiltRef}
        className={className}
        style={{ ...style, position: "relative", transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {children}

        {/*
          ┌─ SHINE GROUP (mix-blend-mode: color-dodge → card) ──────────────────┐
          │  Mirrors .card__shine with its ::before and ::after pseudo-elements. │
          │  Layers inside blend with each other first; then the whole group     │
          │  color-dodges once against the card image.                           │
          │                                                                      │
          │  shine1 (base) : rainbow stripes + scanlines, overlay blend          │
          │  shine2 (::before): dual-period vertical bars, hard-light blend      │
          │  shine3 (::after) : radial luminosity spot at cursor                 │
          └──────────────────────────────────────────────────────────────────────┘
        */}
        <div
          ref={shineGroupRef}
          aria-hidden="true"
          style={{ ...abs, mixBlendMode: "color-dodge", opacity: 0, zIndex: 1, clipPath: ARTWORK_CLIP }}
        >
          {/* Rainbow stripes + fine scanlines */}
          <div
            ref={shine1Ref}
            style={{
              ...abs,
              backgroundImage: `${RAINBOW}, ${SCANLINES}`,
              backgroundBlendMode: "overlay",
              backgroundSize: "400% 400%, cover",
              backgroundPosition: "50% 50%, center",
              filter: "brightness(1.1) contrast(1.1) saturate(1.2)",
            }}
          />

          {/* Vertical Moiré beam — two overlapping bar gradients */}
          <div
            ref={shine2Ref}
            style={{
              ...abs,
              backgroundImage: `${BARS_1}, ${BARS_2}`,
              backgroundBlendMode: "screen",
              backgroundSize: "200% 200%, 200% 200%",
              backgroundPosition: "50% 50%, 50% 50%",
              filter: "brightness(1.15) contrast(1.1)",
              mixBlendMode: "hard-light",
            }}
          />

          {/* Luminosity spot at cursor — boosts brightness where light hits */}
          <div
            ref={shine3Ref}
            style={{
              ...abs,
              backgroundImage: "radial-gradient(farthest-corner circle at 50% 50%, hsla(0,0%,90%,0.3) 0%, hsla(0,0%,60%,0.05) 30%, hsl(0,0%,0%) 85%)",
              mixBlendMode: "luminosity",
              filter: "brightness(0.55) contrast(2)",
            }}
          />
        </div>

        {/* Glare: cursor highlight across the whole card */}
        <div
          ref={glare1Ref}
          aria-hidden="true"
          style={{ ...abs, mixBlendMode: "overlay", opacity: 0, zIndex: 2 }}
        />
        <div ref={glare2Ref} style={{ display: "none" }} />
      </div>
    </div>
  );
}
