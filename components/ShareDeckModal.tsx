"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ShareCard {
  token_symbol: string;
  token_name: string;
  rendered_image_url: string | null;
}

interface ShareDeckModalProps {
  open: boolean;
  onClose: () => void;
  cards: ShareCard[];
}

const CANVAS_W = 1200;
const CANVAS_H = 675;
const CARD_RATIO = 567 / 889;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `${src}?t=${Date.now()}`;
  });
}

const FONT_NAME = "Instrument Sans";
const FONT_URL =
  "https://fonts.gstatic.com/s/instrumentsans/v1/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8CuHHqg8A.woff2";

let fontLoaded = false;
async function ensureFont() {
  if (fontLoaded || document.fonts.check(`500 16px "${FONT_NAME}"`)) {
    fontLoaded = true;
    return;
  }
  const face = new FontFace(FONT_NAME, `url(${FONT_URL})`, { weight: "500" });
  const loaded = await face.load();
  document.fonts.add(loaded);
  fontLoaded = true;
}

async function generateShareImage(cards: ShareCard[]): Promise<HTMLCanvasElement> {
  await ensureFont();

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;

  const bg = await loadImage("/share_bg.jpeg");
  ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const cardImages = await Promise.allSettled(
    cards.map((c) =>
      c.rendered_image_url ? loadImage(c.rendered_image_url) : Promise.reject("no url"),
    ),
  );

  const count = cards.length;
  if (count > 0) {
    const cardH = 420;
    const cardW = Math.round(cardH * CARD_RATIO);
    const r = 14;

    const maxAngle = 10;
    const fanSpread = 380;
    const arcDrop = 50;
    const centerX = CANVAS_W / 2;
    const centerY = (CANVAS_H - 30) / 2 + cardH / 2;

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : (i - (count - 1) / 2) / ((count - 1) / 2);
      const angle = t * maxAngle;
      const rad = (angle * Math.PI) / 180;
      const offsetX = t * fanSpread;
      const offsetY = t * t * arcDrop;

      ctx.save();
      ctx.translate(centerX + offsetX, centerY + offsetY);
      ctx.rotate(rad);

      const dx = -cardW / 2;
      const dy = -cardH;

      ctx.beginPath();
      ctx.roundRect(dx, dy, cardW, cardH, r);
      ctx.clip();

      const result = cardImages[i];
      if (result.status === "fulfilled") {
        ctx.drawImage(result.value, dx, dy, cardW, cardH);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(dx, dy, cardW, cardH);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(dx, dy, cardW, cardH, r);
      ctx.stroke();

      ctx.restore();
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 26px "${FONT_NAME}", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("hodleague.com", CANVAS_W / 2, CANVAS_H - 18);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

export function ShareDeckModal({ open, onClose, cards }: ShareDeckModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateShareImage(cards);
      canvasRef.current = canvas;
      setImageUrl(canvas.toDataURL("image/png"));
    } catch {
      /* generation failed silently */
    } finally {
      setIsGenerating(false);
    }
  }, [cards]);

  useEffect(() => {
    if (open && cards.length > 0) {
      generate();
    }
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [open, cards, generate]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const tickers = cards.map((c) => `$${c.token_symbol}`).join(" ");
  const tweetText = `I just locked in my deck for the @Hodleague tournament \n\n${tickers}\n\nThink you can beat me? Pick your cards, build your deck, and let the market decide who's the real alpha`;

  const handleSave = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hodleague-deck.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      /* save failed */
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* copy failed */
    }
  };

  const handleTwitterShare = async () => {
    if (canvasRef.current) {
      try {
        const blob = await canvasToBlob(canvasRef.current);
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } catch {
        /* clipboard copy best-effort */
      }
    }
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      />

      <div
        className="relative bg-[var(--surface)] w-full max-w-[640px] rounded-[24px] border border-[var(--border-subtle)] overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Share Deck</h3>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
            aria-label="Close"
            data-ph-capture-attribute-button="share-deck-modal-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="px-5 pb-4">
          <div className="rounded-[16px] overflow-hidden bg-black/10 border border-[var(--border-subtle)]">
            {isGenerating ? (
              <div className="flex items-center justify-center" style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Deck share preview"
                className="w-full h-auto block"
                draggable={false}
              />
            ) : (
              <div className="flex items-center justify-center text-[var(--text-muted)] text-sm py-12">
                Failed to generate image
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleSave}
            disabled={!imageUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[var(--border-subtle)]"
            data-ph-capture-attribute-button="share-deck-save-image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Save to device
          </button>

          <button
            onClick={handleCopy}
            disabled={!imageUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border border-[var(--border-subtle)]"
            data-ph-capture-attribute-button="share-deck-copy-image"
          >
            {copySuccess ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleTwitterShare}
            disabled={!imageUrl}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: "#000" }}
            data-ph-capture-attribute-button="share-deck-x"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
        </div>
      </div>
    </div>
  );
}
