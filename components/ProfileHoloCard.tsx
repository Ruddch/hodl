"use client";

import { useRef, useCallback, useEffect, type ReactNode, type CSSProperties, type KeyboardEvent } from "react";

interface SpringValues {
  rotX: number;
  rotY: number;
  glareX: number;
  glareY: number;
  opacity: number;
}

interface ProfileHoloCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  tabIndex?: number;
  role?: string;
  "data-ph-capture-attribute-button"?: string;
}

const LERP = 0.1;
const LERP_SNAP = 0.05;
const MAX_ROTATE_DEG = 14;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function ProfileHoloCard({
  children,
  className,
  style,
  onClick,
  onKeyDown,
  tabIndex,
  role,
  "data-ph-capture-attribute-button": dataPhCapture,
}: ProfileHoloCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const current = useRef<SpringValues>({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, opacity: 0 });
  const target = useRef<SpringValues>({ rotX: 0, rotY: 0, glareX: 50, glareY: 50, opacity: 0 });
  const hovering = useRef(false);

  const applyStyles = useCallback((v: SpringValues) => {
    if (tiltRef.current) {
      tiltRef.current.style.transform = `rotateX(${v.rotY}deg) rotateY(${v.rotX}deg)`;
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = String(v.opacity * 0.65);
      glareRef.current.style.backgroundImage = `radial-gradient(farthest-corner circle at ${v.glareX}% ${v.glareY}%, rgba(255,255,255,0.55) 0%, transparent 70%)`;
    }
  }, []);

  const animate = useCallback(() => {
    const c = current.current;
    const t = target.current;
    const lerpFactor = hovering.current ? LERP : LERP_SNAP;

    c.rotX = lerp(c.rotX, t.rotX, lerpFactor);
    c.rotY = lerp(c.rotY, t.rotY, lerpFactor);
    c.glareX = lerp(c.glareX, t.glareX, lerpFactor);
    c.glareY = lerp(c.glareY, t.glareY, lerpFactor);
    c.opacity = lerp(c.opacity, t.opacity, lerpFactor);

    applyStyles(c);

    const done =
      !hovering.current &&
      Math.abs(t.rotX - c.rotX) < 0.02 &&
      Math.abs(t.rotY - c.rotY) < 0.02 &&
      Math.abs(t.opacity - c.opacity) < 0.005;

    if (!done) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      c.rotX = 0;
      c.rotY = 0;
      c.opacity = 0;
      applyStyles(c);
      rafRef.current = null;
    }
  }, [applyStyles]);

  const startRaf = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = Math.min(100, Math.max(0, Math.round((100 / rect.width) * (e.clientX - rect.left))));
    const py = Math.min(100, Math.max(0, Math.round((100 / rect.height) * (e.clientY - rect.top))));

    const cx = px - 50;
    const cy = py - 50;

    target.current = {
      rotX: Math.max(-MAX_ROTATE_DEG, Math.min(MAX_ROTATE_DEG, -(cx / 3.5))),
      rotY: Math.max(-MAX_ROTATE_DEG, Math.min(MAX_ROTATE_DEG, cy / 3.5)),
      glareX: px,
      glareY: py,
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
    target.current = { rotX: 0, rotY: 0, glareX: 50, glareY: 50, opacity: 0 };
    startRaf();
  }, [startRaf]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
        style={{
          ...style,
          transformStyle: "preserve-3d",
          willChange: "transform",
          position: "relative",
        }}
      >
        {children}

        {/* Glare overlay */}
        <div
          ref={glareRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            mixBlendMode: "overlay",
            opacity: 0,
            zIndex: 10,
          }}
        />
      </div>
    </div>
  );
}
