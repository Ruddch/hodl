"use client";

import {
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

const RAINBOW_GRADIENT = `repeating-linear-gradient(
  82deg,
  hsl(53,  65%, 60%) calc(4% * 1),
  hsl(93,  56%, 50%) calc(4% * 2),
  hsl(176, 54%, 49%) calc(4% * 3),
  hsl(228, 59%, 55%) calc(4% * 4),
  hsl(283, 60%, 55%) calc(4% * 5),
  hsl(326, 59%, 51%) calc(4% * 6),
  hsl(326, 59%, 51%) calc(4% * 7),
  hsl(283, 60%, 55%) calc(4% * 8),
  hsl(228, 59%, 55%) calc(4% * 9),
  hsl(176, 54%, 49%) calc(4% * 10),
  hsl(93,  56%, 50%) calc(4% * 11),
  hsl(53,  65%, 60%) calc(4% * 12)
)`;


function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// reverse.png mask: white area = artwork zone (luminance=1 → visible),
// dark areas (border, stats zone) = luminance≈0 → hidden
const MASK: CSSProperties = {
  WebkitMaskImage: "url('/reverse.png')",
  maskImage: "url('/reverse.png')",
  WebkitMaskSize: "cover",
  maskSize: "cover",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
};

interface ReverseHoloCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  role?: string;
  "data-ph-capture-attribute-button"?: string;
}

export function ReverseHoloCard({
  children,
  className,
  style,
  onClick,
  onKeyDown,
  tabIndex,
  role,
  "data-ph-capture-attribute-button": dataPhCapture,
}: ReverseHoloCardProps) {
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const tiltRef       = useRef<HTMLDivElement>(null);
  const shineGroupRef = useRef<HTMLDivElement>(null);
  const shine1Ref     = useRef<HTMLDivElement>(null);
  const shine2Ref     = useRef<HTMLDivElement>(null);
  const shine3Ref     = useRef<HTMLDivElement>(null);
  const glare1Ref     = useRef<HTMLDivElement>(null);
  const glare2Ref     = useRef<HTMLDivElement>(null);
  const rafRef        = useRef<number | null>(null);
  const animateRef    = useRef<() => void>(() => {});
  const hovering      = useRef(false);

  const seedX = useRef(0);
  const seedY = useRef(0);
  useEffect(() => {
    seedX.current = Math.floor(Math.random() * 734);
    seedY.current = Math.floor(Math.random() * 1280);
  }, []);

  const curr = useRef({ rotX: 0, rotY: 0, px: 50, py: 50, pfl: 0.5, pft: 0.5, opacity: 0 });
  const targ = useRef({ rotX: 0, rotY: 0, px: 50, py: 50, pfl: 0.5, pft: 0.5, opacity: 0 });

  const applyStyles = useCallback(() => {
    const c = curr.current;

    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${c.rotY}deg) rotateY(${c.rotX}deg)`;
    }

    if (shineGroupRef.current) {
      shineGroupRef.current.style.opacity = String(c.opacity);
    }

    const cosmosPos = `${seedX.current}px ${seedY.current}px`;

    if (shine1Ref.current) {
      const rPos = `${10 + c.pfl * 80}% ${10 + c.pft * 80}%`;
      shine1Ref.current.style.backgroundPosition = `${cosmosPos}, ${rPos}, center`;
    }
    if (shine2Ref.current) {
      const rPos = `${15 + c.pfl * 70}% ${15 + c.pft * 70}%`;
      shine2Ref.current.style.backgroundPosition = `${cosmosPos}, ${rPos}`;
    }
    if (shine3Ref.current) {
      const rPos = `${20 + c.pfl * 60}% ${20 + c.pft * 60}%`;
      shine3Ref.current.style.backgroundPosition = `${cosmosPos}, ${rPos}`;
    }

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
    const t = targ.current;
    const lerpF = hovering.current ? 0.1 : 0.05;

    c.rotX    = lerp(c.rotX,    t.rotX,    lerpF);
    c.rotY    = lerp(c.rotY,    t.rotY,    lerpF);
    c.px      = lerp(c.px,      t.px,      lerpF);
    c.py      = lerp(c.py,      t.py,      lerpF);
    c.pfl     = lerp(c.pfl,     t.pfl,     lerpF);
    c.pft     = lerp(c.pft,     t.pft,     lerpF);
    c.opacity = lerp(c.opacity, t.opacity, lerpF);

    applyStyles();

    const isDone =
      !hovering.current &&
      Math.abs(t.rotX    - c.rotX)    < 0.02 &&
      Math.abs(t.rotY    - c.rotY)    < 0.02 &&
      Math.abs(t.opacity - c.opacity) < 0.005;

    if (!isDone) {
      rafRef.current = requestAnimationFrame(animateRef.current);
    } else {
      c.rotX = 0; c.rotY = 0; c.opacity = 0;
      applyStyles();
      rafRef.current = null;
    }
  }, [applyStyles]);

  useEffect(() => { animateRef.current = animate; }, [animate]);

  const startRaf = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animateRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(100, Math.max(0, Math.round((100 / rect.width)  * (e.clientX - rect.left))));
    const py = Math.min(100, Math.max(0, Math.round((100 / rect.height) * (e.clientY - rect.top))));
    const cx = px - 50;
    const cy = py - 50;
    targ.current = {
      rotX: Math.max(-14, Math.min(14, -(cx / 3.5))),
      rotY: Math.max(-14, Math.min(14,  cy / 3.5)),
      px, py,
      pfl: px / 100,
      pft: py / 100,
      opacity: 1,
    };
    startRaf();
  }, [startRaf]);

  const handleMouseEnter = useCallback(() => { hovering.current = true;  startRaf(); }, [startRaf]);
  const handleMouseLeave = useCallback(() => {
    hovering.current = false;
    targ.current = { rotX: 0, rotY: 0, px: 50, py: 50, pfl: 0.5, pft: 0.5, opacity: 0 };
    startRaf();
  }, [startRaf]);

  useEffect(() => {
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, []);

  const abs: CSSProperties = { position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none" };

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

        {/* Shine group — same Galaxy/Cosmos effect as CosmosHoloCard,
            but clipped by reverse.png mask (luminance) instead of inset clip-path */}
        <div
          ref={shineGroupRef}
          aria-hidden="true"
          style={{ ...abs, mixBlendMode: "color-dodge", opacity: 0, zIndex: 1, ...MASK }}
        >
          <div
            ref={shine1Ref}
            style={{
              ...abs,
              backgroundImage: `url('/cosmos-bottom.png'), ${RAINBOW_GRADIENT}`,
              backgroundBlendMode: "color-burn, multiply",
              backgroundSize: "cover, 400% 900%",
              backgroundPosition: "center, 50% 50%",
              filter: "brightness(1) contrast(1) saturate(0.8)",
            }}
          />
          <div
            ref={shine2Ref}
            style={{
              ...abs,
              backgroundImage: `url('/cosmos-middle-trans.png'), ${RAINBOW_GRADIENT}`,
              backgroundBlendMode: "lighten, multiply",
              backgroundSize: "cover, 400% 900%",
              backgroundPosition: "center, 50% 50%",
              filter: "brightness(1.25) contrast(1.75) saturate(0.8)",
              mixBlendMode: "overlay",
            }}
          />
          <div
            ref={shine3Ref}
            style={{
              ...abs,
              backgroundImage: `url('/cosmos-top-trans.png'), ${RAINBOW_GRADIENT}`,
              backgroundBlendMode: "multiply, multiply",
              backgroundSize: "cover, 400% 900%",
              backgroundPosition: "center, 50% 50%",
              filter: "brightness(1.25) contrast(1.75) saturate(0.8)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* Glare: follows cursor across the whole card (no mask) */}
        <div
          ref={glare1Ref}
          aria-hidden="true"
          style={{ ...abs, mixBlendMode: "overlay", opacity: 0, zIndex: 2 }}
        />
        <div
          ref={glare2Ref}
          aria-hidden="true"
          style={{ ...abs, mixBlendMode: "soft-light", opacity: 0, zIndex: 3 }}
        />
      </div>
    </div>
  );
}
