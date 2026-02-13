"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { OnboardingStep, OnboardingConfig } from "@/lib/onboarding-types";

const PADDING = 8;
const TOOLTIP_OFFSET = 12;
const TRANSITION_DURATION = 350;

const transitionStyle = {
  transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
};

type Placement = NonNullable<OnboardingStep["placement"]>;

interface OnboardingProps {
  /** Шаги онбординга */
  steps: OnboardingConfig;
  /** Запускать тур */
  run: boolean;
  /** Callback при закрытии */
  onClose: () => void;
  /** Callback при завершении всех шагов */
  onComplete?: () => void;
}

function getTargetRect(selector: string): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  return el ? el.getBoundingClientRect() : null;
}

export function Onboarding({ steps, run, onClose, onComplete }: OnboardingProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const rect = getTargetRect(currentStep.target);
    setTargetRect(rect);
  }, [currentStep]);

  // Обновление позиции при смене шага, скролле, ресайзе
  useEffect(() => {
    if (!run || !currentStep) return;

    const id = requestAnimationFrame(() => updateTargetRect());
    const interval = setInterval(updateTargetRect, 100);
    window.addEventListener("scroll", updateTargetRect, true);
    window.addEventListener("resize", updateTargetRect);

    return () => {
      cancelAnimationFrame(id);
      clearInterval(interval);
      window.removeEventListener("scroll", updateTargetRect, true);
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [run, currentStep, stepIndex, updateTargetRect]);

  // Скролл к элементу при смене шага
  useEffect(() => {
    if (!run || !currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [run, stepIndex, currentStep]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete?.();
      onClose();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [isLastStep, onComplete, onClose, steps.length]);

  const handleBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  if (!run || !currentStep || steps.length === 0) return null;

  const rect = targetRect;
  const placement: Placement = currentStep.placement ?? "bottom";
  const spotlightRadius = currentStep.spotlightRadius ?? 0;

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      {/* Кликабельный слой — тень box-shadow не ловит события, нужен отдельный слой */}
      <div
        className="absolute inset-0 cursor-pointer pointer-events-auto"
        onClick={onClose}
        aria-hidden
      />
      {/* Blur — 4 панели (прямоугольная дырка, без скругления) */}
      {rect && (
        <>
          <div
            className="absolute left-0 right-0 top-0 backdrop-blur-md pointer-events-none"
            style={{ ...transitionStyle, height: Math.max(0, rect.top - PADDING) }}
            aria-hidden
          />
          <div
            className="absolute left-0 right-0 bottom-0 backdrop-blur-md pointer-events-none"
            style={{
              ...transitionStyle,
              height: Math.max(0, window.innerHeight - rect.bottom - PADDING),
            }}
            aria-hidden
          />
          <div
            className="absolute backdrop-blur-md pointer-events-none"
            style={{
              ...transitionStyle,
              top: rect.top - PADDING,
              left: 0,
              width: Math.max(0, rect.left - PADDING),
              height: rect.height + PADDING * 2,
            }}
            aria-hidden
          />
          <div
            className="absolute backdrop-blur-md pointer-events-none"
            style={{
              ...transitionStyle,
              top: rect.top - PADDING,
              left: rect.right + PADDING,
              width: Math.max(0, window.innerWidth - rect.right - PADDING),
              height: rect.height + PADDING * 2,
            }}
            aria-hidden
          />
        </>
      )}
      {/* Затемнение через box-shadow: скруглённая «дырка» */}
      {rect && (
        <div
          className="absolute pointer-events-none"
          style={{
            ...transitionStyle,
            left: rect.left - PADDING,
            top: rect.top - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            borderRadius: spotlightRadius,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
          }}
          aria-hidden
        />
      )}

      {/* Tooltip */}
      {rect && (
        <div
          ref={tooltipRef}
          className="absolute z-[81] bg-white rounded-xl shadow-lg border border-black/5 min-w-[280px] max-w-[400px] p-5 pointer-events-auto"
          style={{ ...getTooltipPosition(rect, placement), ...transitionStyle }}
        >
          {/* Стрелка вверх (если placement bottom) */}
          {placement === "bottom" && (
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-white rotate-45 border-l border-t border-black/5"
            />
          )}
          {placement === "top" && (
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white rotate-45 border-r border-b border-black/5" />
          )}

          {/* Кнопка закрытия */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-black/60 hover:text-black transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="text-lg font-semibold text-black pr-10 mb-2">{currentStep.title}</h3>
          <p className="text-[15px] text-black/70 leading-relaxed mb-5">{currentStep.content}</p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-black/50">
              {stepIndex + 1} of {steps.length} steps
            </span>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-black/70 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#2200EF] hover:opacity-90 rounded-[15px] transition-opacity"
              >
                {isLastStep ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTooltipPosition(rect: DOMRect, placement: Placement): React.CSSProperties {
  switch (placement) {
    case "bottom":
      return {
        left: rect.left + rect.width / 2,
        top: rect.bottom + TOOLTIP_OFFSET,
        transform: "translateX(-50%)",
      };
    case "top":
      return {
        left: rect.left + rect.width / 2,
        top: rect.top - TOOLTIP_OFFSET,
        transform: "translate(-50%, -100%)",
      };
    case "left":
      return {
        right: window.innerWidth - rect.left + TOOLTIP_OFFSET,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        left: rect.right + TOOLTIP_OFFSET,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      };
    default:
      return {
        left: rect.left + rect.width / 2,
        top: rect.bottom + TOOLTIP_OFFSET,
        transform: "translateX(-50%)",
      };
  }
}

