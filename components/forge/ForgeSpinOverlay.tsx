"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CardBurnAnimation } from "@/components/forge/CardBurnAnimation";
import { loadImageForCanvas } from "@/lib/loadImageForCanvas";
import type { UserCard } from "@/lib/types";

// ─── Rarity visual config ──────────────────────────────────────────────────────

const RARITY_ORDER = ["common", "rare", "epic", "legendary"] as const;
type RarityKey = (typeof RARITY_ORDER)[number];

interface RarityVisual {
  /** RGB components for rgba() calls, e.g. "13,189,233" */
  lineRgb: string;
  sparkColors: string[];
  /** Ambient background glow */
  glowRgba: string;
}

const RARITY_VISUAL: Record<RarityKey, RarityVisual> = {
  common: {
    lineRgb:     "200,210,220",
    sparkColors: ["#c8d8e8", "#e2eef8", "#ffffff"],
    glowRgba:    "rgba(200,210,220,0.16)",
  },
  rare: {
    lineRgb:     "13,189,233",
    sparkColors: ["#0dbde9", "#38bdf8", "#7dd3fc", "#ffffff"],
    glowRgba:    "rgba(13,189,233,0.20)",
  },
  epic: {
    lineRgb:     "138,43,226",
    sparkColors: ["#a855f7", "#c084fc", "#e9d5ff", "#ffffff"],
    glowRgba:    "rgba(138,43,226,0.18)",
  },
  legendary: {
    lineRgb:     "255,195,110",
    sparkColors: ["#fbbf24", "#fde68a", "#f59e0b", "#ffffff"],
    glowRgba:    "rgba(255,195,110,0.20)",
  },
};

function nextRarityVisual(rarityName: string): RarityVisual {
  const n      = rarityName.trim().toLowerCase() as RarityKey;
  const idx    = RARITY_ORDER.indexOf(n);
  const nextKey =
    idx >= 0 && idx < RARITY_ORDER.length - 1
      ? RARITY_ORDER[idx + 1]
      : RARITY_ORDER[RARITY_ORDER.length - 1];
  return RARITY_VISUAL[nextKey] ?? RARITY_VISUAL.rare;
}

// ─── Easings ───────────────────────────────────────────────────────────────────

function easeOutQuart(t: number) { return 1 - (1 - t) ** 4; }
function easeInQuart(t: number)  { return t ** 4; }
function easeInOut(t: number)    { return t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2; }

// ─── Spark ─────────────────────────────────────────────────────────────────────

interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; decay: number;
  size: number; color: string;
  angle: number;
  type: "ember" | "star";
}

// ─── Animation timing & physics ────────────────────────────────────────────────

/** Card width / height ratio */
const CARD_ASPECT = 567 / 889;

/** Initial fast rise from bottom to the fight zone */
const APPROACH_MS  = 1100;
/** Minimum fighting time before the result is allowed to trigger resolving */
const MIN_FIGHT_MS = 600;
/** Final resolution durations */
const RESOLVE_S_MS = 950;
const RESOLVE_F_MS = 700;

/** Spring stiffness */
const SPRING_K    = 13;
/** Velocity damping */
const SPRING_DAMP = 5.5;

// ─── Types ─────────────────────────────────────────────────────────────────────

type BurnScene = "none" | "burning" | "burnt";
type LinePhase = "rising" | "fighting" | "resolving" | "done";

export interface ForgeSpinOverlayProps {
  result: "success" | "failure" | null;
  /** 0–1 probability of success — determines how high the line rises on approach */
  probability: number;
  cards: UserCard[];
  /** Image URL of the upgraded (next-rarity) card. Falls back to current card when absent. */
  nextCardImageUrl?: string;
  onSpinComplete: () => void;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ForgeSpinOverlay({
  result,
  probability,
  cards,
  nextCardImageUrl,
  onSpinComplete,
  onClose,
}: ForgeSpinOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef(0);
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null);

  // UI state
  const [visible,       setVisible]       = useState(false);
  const [closing,       setClosing]       = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [burnScene,     setBurnScene]     = useState<BurnScene>("none");
  const [burnActive,    setBurnActive]    = useState(false);
  const [canvasFading,  setCanvasFading]  = useState(false);
  const [burnGeom,      setBurnGeom]      = useState<{ left: number; top: number; width: number } | null>(null);

  // Refs that cross into the RAF loop
  const resultRef      = useRef(result);
  const probabilityRef = useRef(probability);
  const cbRef          = useRef(onSpinComplete);
  useEffect(() => { resultRef.current      = result; },      [result]);
  useEffect(() => { probabilityRef.current = probability; }, [probability]);
  useEffect(() => { cbRef.current          = onSpinComplete; }, [onSpinComplete]);

  const firstCard = cards[0] ?? null;
  const visual    = firstCard ? nextRarityVisual(firstCard.rarity_name) : RARITY_VISUAL.rare;
  const visualRef = useRef(visual);
  useEffect(() => { visualRef.current = visual; }, [visual]);

  // Mutable animation state (lives inside RAF loop, never triggers re-renders)
  const anim = useRef({
    linePhase:    "rising" as LinePhase,
    lineProgress: 1.0,   // 0 = top of card, 1 = bottom
    phaseT0:      -1,

    lineVelocity:     0,
    approachTarget:   0.15,
    fightTarget:      0.15,
    fightNextEventT:  0,
    resolveStartProg: 0,
    lastFrameT:      -1,

    sparks:    [] as Spark[],
    lastEmit:  0,
    img:       null as HTMLImageElement | null,
    imgReady:  false,
    imgNext:   null as HTMLImageElement | null,
    cx: 0, cy: 0, cw: 240, ch: 377,
  });

  // Fade in on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Load current card image
  useEffect(() => {
    const a = anim.current;
    if (!firstCard?.rendered_image_url) { a.imgReady = true; return; }
    a.imgReady = false;
    loadImageForCanvas(firstCard.rendered_image_url, { bust: firstCard.user_card_id })
      .then(img => { a.img = img; a.imgReady = true; })
      .catch(()  => { a.imgReady = true; });
  }, [firstCard?.rendered_image_url, firstCard?.user_card_id]);

  // Load next-rarity card image
  useEffect(() => {
    const a = anim.current;
    a.imgNext = null;
    if (!nextCardImageUrl) return;
    loadImageForCanvas(nextCardImageUrl, { bust: nextCardImageUrl })
      .then(img => { a.imgNext = img; })
      .catch(()  => {});
  }, [nextCardImageUrl]);

  // Canvas resize
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = containerRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = wrap.clientWidth;
    const H   = wrap.clientHeight;
    canvas.width        = Math.floor(W * dpr);
    canvas.height       = Math.floor(H * dpr);
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const uiH  = 190;
    const maxW = W - 48;
    const maxH = H - 48 - uiH;
    let cw = Math.min(maxW, 300);
    let ch = cw / CARD_ASPECT;
    if (ch > maxH) { ch = maxH; cw = ch * CARD_ASPECT; }
    const a = anim.current;
    a.cx    = (W - cw) / 2;
    a.cy    = Math.max(16, (H - uiH - ch) / 2);
    a.cw    = cw;
    a.ch    = ch;
  }, []);

  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resize]);

  // ── Main animation loop ────────────────────────────────────────────────────
  useEffect(() => {
    const a = anim.current;
    a.linePhase        = "rising";
    a.lineProgress     = 1.0;
    a.lineVelocity     = 0;
    a.phaseT0          = -1;
    a.lastFrameT       = -1;
    // Approach target maps directly to probability:
    // 10% → line rises 10% from bottom → lineProgress = 0.90
    // 50% → line rises 50%             → lineProgress = 0.50
    const p = probabilityRef.current;
    a.approachTarget   = Math.max(0.02, 1.0 - p);
    a.fightTarget      = a.approachTarget;
    a.fightNextEventT  = 0;
    a.resolveStartProg = 0;
    a.sparks           = [];
    a.lastEmit         = 0;

    const emitSparks = (lx0: number, lx1: number, ly: number, now: number) => {
      if (now - a.lastEmit < 20 || a.sparks.length >= 80) return;
      a.lastEmit = now;
      const vis = visualRef.current;
      const n   = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
        const spd = 1.8 + Math.random() * 4.3;
        a.sparks.push({
          x:     lx0 + Math.random() * (lx1 - lx0),
          y:     ly  + (Math.random() - 0.5) * 4,
          vx:    Math.cos(ang) * spd,
          vy:    Math.sin(ang) * spd,
          life:  1.0,
          decay: 0.018 + Math.random() * 0.030,
          size:  1.4 + Math.random() * 2.9,
          color: vis.sparkColors[Math.floor(Math.random() * vis.sparkColors.length)],
          angle: Math.random() * Math.PI * 2,
          type:  Math.random() < 1 ? "star" : "ember",
        });
      }
    };

    const loop = (now: number) => {
      if (a.phaseT0 < 0) a.phaseT0 = now;
      const elapsed = now - a.phaseT0;

      // ── Rising ──────────────────────────────────────────────────────────
      if (a.linePhase === "rising") {
        const t = Math.min(elapsed / APPROACH_MS, 1.0);
        a.lineProgress = 1.0 - easeOutQuart(t) * (1.0 - a.approachTarget);
        if (t >= 1.0) {
          a.linePhase       = "fighting";
          a.phaseT0         = now;
          a.lastFrameT      = now;
          a.lineVelocity    = 0;
          a.fightTarget     = a.approachTarget;
          a.fightNextEventT = now + 300 + Math.random() * 500;
        }
      }

      // ── Fighting ─────────────────────────────────────────────────────────
      else if (a.linePhase === "fighting") {
        const dt          = Math.min((now - a.lastFrameT) / 1000, 0.05);
        a.lastFrameT      = now;
        const resultKnown = resultRef.current !== null && elapsed >= MIN_FIGHT_MS;

        if (!resultKnown && now >= a.fightNextEventT) {
          const fishRun   = Math.random() < 0.38;
          a.fightTarget   = fishRun
            ? a.lineProgress + 0.08 + Math.random() * 0.14
            : a.lineProgress - 0.05 - Math.random() * 0.12;
          a.fightTarget       = Math.max(0.01, Math.min(0.97, a.fightTarget));
          a.fightNextEventT   = now + (fishRun ? 400 + Math.random() * 800 : 900 + Math.random() * 1400);
        }

        const spring   = (a.fightTarget - a.lineProgress) * SPRING_K;
        const damp     = -a.lineVelocity * SPRING_DAMP;
        const noise    = (Math.random() - 0.5) * (resultKnown ? 0.02 : 0.28);
        a.lineVelocity += (spring + damp + noise) * dt;
        a.lineProgress  = Math.max(0.01, Math.min(0.98, a.lineProgress + a.lineVelocity * dt));

        if (resultKnown) {
          const settled = Math.abs(a.lineProgress - a.fightTarget) < 0.02
                       && Math.abs(a.lineVelocity) < 0.06;
          if (settled) {
            a.linePhase        = "resolving";
            a.phaseT0          = now;
            a.lineVelocity     = 0;
            a.resolveStartProg = a.lineProgress;
          }
        }
      }

      // ── Resolving ────────────────────────────────────────────────────────
      else if (a.linePhase === "resolving") {
        const isS  = resultRef.current === "success";
        const dur  = isS ? RESOLVE_S_MS : RESOLVE_F_MS;
        const t    = Math.min(elapsed / dur, 1.0);
        const start = a.resolveStartProg;
        a.lineProgress = start + (isS
          ? easeInOut(t)   * (-0.06 - start)
          : easeInQuart(t) * (1.15  - start));

        if (t >= 1.0) {
          a.linePhase = "done";
          cbRef.current();
          if (isS) {
            setTimeout(() => setResultVisible(true), 350);
          } else {
            setTimeout(() => {
              setBurnGeom({ left: a.cx, top: a.cy, width: a.cw });
              setBurnScene("burning");
            }, 200);
          }
        }
      }

      // ── Draw ─────────────────────────────────────────────────────────────
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(loop); return; }
      if (!ctxRef.current) ctxRef.current = canvas.getContext("2d");
      const ctx = ctxRef.current;
      if (!ctx)  { rafRef.current = requestAnimationFrame(loop); return; }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      if (!a.imgReady || a.cw === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { cx, cy, cw, ch } = a;
      const lineY = cy + a.lineProgress * ch;
      const vis   = visualRef.current;

      // Card Path2D — built once per frame, reused for clip + stroke
      const cr    = 14;
      const cardP = new Path2D();
      cardP.moveTo(cx + cr, cy);
      cardP.lineTo(cx + cw - cr, cy);
      cardP.arcTo(cx + cw, cy,      cx + cw, cy + cr,      cr);
      cardP.lineTo(cx + cw, cy + ch - cr);
      cardP.arcTo(cx + cw, cy + ch, cx + cw - cr, cy + ch, cr);
      cardP.lineTo(cx + cr, cy + ch);
      cardP.arcTo(cx, cy + ch,      cx, cy + ch - cr,       cr);
      cardP.lineTo(cx, cy + cr);
      cardP.arcTo(cx, cy,           cx + cr, cy,            cr);
      cardP.closePath();

      // Top half — current rarity
      const topH = Math.max(0, Math.min(lineY - cy, ch));
      if (topH > 0 && a.img) {
        ctx.save();
        ctx.clip(cardP);
        ctx.beginPath(); ctx.rect(cx, cy, cw, topH); ctx.clip();
        ctx.drawImage(a.img, cx, cy, cw, ch);
        ctx.restore();
      }

      // Bottom half — next rarity (falls back to current card)
      const btmY = Math.max(cy, lineY);
      const btmH = Math.max(0, cy + ch - btmY);
      if (btmH > 0) {
        ctx.save();
        ctx.clip(cardP);
        ctx.beginPath(); ctx.rect(cx, btmY, cw, btmH); ctx.clip();
        const btmImg = a.imgNext ?? a.img;
        if (btmImg) {
          ctx.drawImage(btmImg, cx, cy, cw, ch);
        } else {
          ctx.fillStyle = "#1e2035";
          ctx.fillRect(cx, btmY, cw, btmH);
        }
        ctx.restore();
      }

      // No-image fallback
      if (!a.img && !a.imgNext) {
        ctx.save(); ctx.fillStyle = "#1e2035"; ctx.fill(cardP); ctx.restore();
      }


      // ── Energy line ───────────────────────────────────────────────────────
      const lineOnCard = lineY > cy - 10 && lineY < cy + ch + 10;
      if (lineOnCard && a.linePhase !== "done") {
        const lRgb               = vis.lineRgb;
        const isResolvingSuccess = a.linePhase === "resolving" && resultRef.current === "success";
        // Subtle pulse on the outer glow
        const pulse = 0.82 + 0.18 * Math.sin(now * 0.009);

        // Wavy Path2D — built once, stroked 6 times for layered glow
        const wP  = new Path2D();
        const amp = isResolvingSuccess ? 1.0 : 2.8;
        for (let i = 0; i <= 20; i++) {
          const lx = cx + (i / 20) * cw;
          const wy = lineY + Math.sin(i * 0.65 + now * 0.005) * amp;
          if (i === 0) wP.moveTo(lx, wy); else wP.lineTo(lx, wy);
        }

        ctx.save();
        ctx.lineCap  = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = `rgba(${lRgb},${(0.09 * pulse).toFixed(3)})`; ctx.lineWidth = 36;  ctx.stroke(wP);
        ctx.strokeStyle = `rgba(${lRgb},${(0.20 * pulse).toFixed(3)})`; ctx.lineWidth = 22;  ctx.stroke(wP);
        ctx.strokeStyle = `rgba(${lRgb},0.40)`;                          ctx.lineWidth = 11;  ctx.stroke(wP);
        ctx.strokeStyle = `rgba(${lRgb},0.72)`;                          ctx.lineWidth = 5.5; ctx.stroke(wP);
        ctx.strokeStyle = `rgba(${lRgb},0.95)`;                          ctx.lineWidth = 2.5; ctx.stroke(wP);
        ctx.strokeStyle = "rgba(255,255,255,0.95)";                       ctx.lineWidth = 1.0; ctx.stroke(wP);

        ctx.restore();
        emitSparks(cx, cx + cw, lineY, now);
      }

      // ── Sparks — additive blending makes overlapping glows accumulate ─────
      if (a.sparks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (let i = a.sparks.length - 1; i >= 0; i--) {
          const s = a.sparks[i];
          s.x    += s.vx; s.y += s.vy;
          s.vy   += 0.07; s.vx *= 0.97;
          s.life -= s.decay;
          if (s.life <= 0) { a.sparks.splice(i, 1); continue; }
          const alpha = Math.min(1, s.life);

          if (s.type === "star") {
            // 4-pointed star shape — rotates as it flies
            s.angle += 0.06;
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.angle);
            const outer = s.size * 2.4;
            const inner = s.size * 0.28;
            // Colored outer star
            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle   = s.color;
            ctx.beginPath();
            for (let p = 0; p < 8; p++) {
              const ang = (p / 8) * Math.PI * 2;
              const r   = p % 2 === 0 ? outer : inner;
              if (p === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
              else         ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            }
            ctx.closePath();
            ctx.fill();
            // White-hot core star
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = "#ffffff";
            ctx.beginPath();
            for (let p = 0; p < 8; p++) {
              const ang = (p / 8) * Math.PI * 2;
              const r   = p % 2 === 0 ? outer * 0.45 : inner * 0.6;
              if (p === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
              else         ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            // Ember: warm-core circle (outer glow → warm yellow → white hot)
            ctx.globalAlpha = alpha * 0.55;
            ctx.fillStyle   = s.color;
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 2.4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = alpha * 0.80;
            ctx.fillStyle   = "rgba(255,220,130,1)";
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = "#ffffff";
            ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 0.42, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }

      if (a.linePhase !== "done" || a.sparks.length > 0) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // runs once on mount — all dynamic values accessed via refs

  const handleBurnVisualReady = useCallback(() => {
    setCanvasFading(true);
    setBurnActive(true);
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 420);
  }, [onClose]);

  const isSuccess = result === "success";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] overflow-hidden"
      style={{
        backgroundColor: visible && !closing ? "rgba(3,7,18,0.93)" : "rgba(3,7,18,0)",
        transition: "background-color 0.4s ease",
      }}
    >
      {/* Ambient colour glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 55%, ${visual.glowRgba} 0%, transparent 70%)`,
          opacity: visible && !closing ? 1 : 0,
          transition: "opacity 0.7s ease",
        }}
      />

      {/* Canvas — card + energy line animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: visible && !closing && !canvasFading ? 1 : 0,
          transition: canvasFading ? "opacity 0.55s ease" : "opacity 0.4s ease",
        }}
      />

      {/* Success UI */}
      {isSuccess && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-14 px-6"
          style={{
            opacity:    resultVisible ? 1 : 0,
            transform:  resultVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
            pointerEvents: resultVisible ? "auto" : "none",
          }}
        >
          <p
            className="text-5xl font-black tracking-wider leading-none text-center"
            style={{
              color:      "#818cf8",
              textShadow: "0 0 32px rgba(129,140,248,0.65), 0 0 64px rgba(129,140,248,0.28)",
              letterSpacing: "0.06em",
            }}
          >
            YOU WON!
          </p>
          <p className="text-sm text-white/55 text-center leading-relaxed">
            Your card has been upgraded successfully.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="py-3 px-12 rounded-[15px] text-sm font-semibold text-white hover:opacity-85 transition-opacity"
            style={{
              background: "linear-gradient(135deg,#4338ca,#6366f1)",
              boxShadow:  "0 4px 24px rgba(99,102,241,0.45)",
            }}
            data-ph-capture-attribute-button="forge-upgrade-result-close"
          >
            Continue
          </button>
        </div>
      )}

      {/* Failure: burn animation + result text */}
      {burnScene !== "none" && firstCard && burnGeom && (
        <>
          <div
            className="absolute"
            style={{
              left:    burnGeom.left,
              top:     burnGeom.top,
              width:   burnGeom.width,
              opacity: burnActive && visible && !closing ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          >
            <CardBurnAnimation
              imageUrl={firstCard.rendered_image_url ?? ""}
              active={burnActive}
              onComplete={() => setBurnScene("burnt")}
              onBurnVisualReady={handleBurnVisualReady}
              imageCacheBust={firstCard.user_card_id}
            />
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-4 pb-14 px-6"
            style={{
              opacity:    burnScene === "burnt" ? 1 : 0,
              transform:  burnScene === "burnt" ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
              pointerEvents: burnScene === "burnt" ? "auto" : "none",
            }}
          >
            <p
              className="text-5xl font-black tracking-wider leading-none text-center"
              style={{
                color:      "#f87171",
                textShadow: "0 0 32px rgba(248,113,113,0.65), 0 0 64px rgba(248,113,113,0.28)",
                letterSpacing: "0.06em",
              }}
            >
              FAILED!
            </p>
            <p className="text-sm text-white/55 text-center leading-relaxed">
              Better luck next time.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="py-3 px-12 rounded-[15px] text-sm font-semibold text-white hover:opacity-85 transition-opacity"
              style={{
                background: "linear-gradient(135deg,#1e1b4b,#4338ca)",
                boxShadow:  "0 4px 24px rgba(67,56,202,0.40)",
              }}
              data-ph-capture-attribute-button="forge-upgrade-result-close"
            >
              Try Again
            </button>
          </div>
        </>
      )}
    </div>
  );
}
