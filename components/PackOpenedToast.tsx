"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./PackOpenedToast.css";

const TOAST_DURATION_MS = 4000;
const SLIDE_DURATION_MS = 400;

interface PackOpenedToastProps {
  visible: boolean;
  onDismiss: () => void;
}

export function PackOpenedToast({ visible, onDismiss }: PackOpenedToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
    }, TOAST_DURATION_MS - SLIDE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!isExiting) return;

    const timer = setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, SLIDE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [isExiting, onDismiss]);

  if (!visible || !mounted || typeof document === "undefined") return null;

  const toast = (
    <div
      className={`fixed top-4 right-4 z-[80] ${isExiting ? "pack-opened-toast-exit" : "pack-opened-toast-enter"}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 shadow-lg backdrop-blur-sm">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--badge-opened)" }}
        >
          <svg
            className="h-4 w-4 text-[var(--badge-opened-text)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Pack opened! View your cards in profile.
        </p>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
