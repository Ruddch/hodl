"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

const TOAST_DURATION_MS = 4000;
const SLIDE_DURATION_MS = 400;

export type ToastVariant = "success" | "error";

interface ToastProps {
  visible: boolean;
  onDismiss: () => void;
  /** По умолчанию success — зелёная галочка. error — красный крестик. */
  variant?: ToastVariant;
  /** Текст или разметка сообщения. По умолчанию "Pack opened! View your cards in profile." для success, "Something went wrong" для error */
  message?: ReactNode;
}

export function Toast({ visible, onDismiss, variant = "success", message }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

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

  if (!visible || typeof document === "undefined") return null;

  const isError = variant === "error";
  const displayMessage: ReactNode =
    message ?? (isError ? "Something went wrong" : "Pack opened! View your cards in profile.");

  const toast = (
    <div
      className={`fixed top-4 right-4 z-[80] ${isExiting ? "toast-exit" : "toast-enter"}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-3 shadow-lg backdrop-blur-sm">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: isError ? "var(--badge-error)" : "var(--badge-opened)" }}
        >
          {isError ? (
            <svg
              className="h-4 w-4"
              style={{ color: "var(--badge-error-text)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
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
          )}
        </div>
        <p
          className="text-sm font-medium"
          style={{ color: isError ? "var(--badge-error-text)" : "var(--text-primary)" }}
        >
          {displayMessage}
        </p>
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}
