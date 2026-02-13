"use client";

import { useState, useCallback, useEffect } from "react";
import type { OnboardingConfig } from "./onboarding-types";
import { useWelcomeClosed } from "./welcome-closed-context";

const STORAGE_KEY_PREFIX = "hodleague_onboarding_seen_";

/**
 * Хук для управления онбордингом.
 * @param key — уникальный ключ тура (например, "tournament"). Используется для localStorage.
 */
export function useOnboarding(key: string, steps: OnboardingConfig) {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;

  const [run, setRun] = useState(false);

  const start = useCallback(() => setRun(true), []);
  const close = useCallback(() => setRun(false), []);

  const complete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
    setRun(false);
  }, [storageKey]);

  const shouldShow = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) !== "true";
  }, [storageKey]);

  const resetSeen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return {
    run,
    steps,
    start,
    close,
    complete,
    shouldShow,
    resetSeen,
  };
}

/**
 * Хук онбординга для страницы с автостартом:
 * - Если пользователь только что закрыл Welcome modal → показываем онбординг этой страницы
 * - Если Welcome не показывался (возвращающийся пользователь) → показываем при заходе на страницу
 * @param key — ключ тура
 * @param steps — шаги
 * @param pageReady — страница загружена (контент готов, например !isLoading && !!data)
 */
export function usePageOnboarding(
  key: string,
  steps: OnboardingConfig,
  pageReady: boolean
) {
  const { run, steps: stepsData, start, close, complete, shouldShow } = useOnboarding(key, steps);
  const { welcomeJustClosed, setWelcomeJustClosed, welcomeVisible } = useWelcomeClosed();

  useEffect(() => {
    if (!shouldShow()) return;

    // Пока welcome открыт — не стартуем онбординг
    if (welcomeVisible) return;

    if (welcomeJustClosed) {
      setWelcomeJustClosed(false);
      if (pageReady) {
        const timer = setTimeout(start, 400);
        return () => clearTimeout(timer);
      }
    }

    // Возвращающийся пользователь — стартуем когда страница готова
    if (pageReady) {
      const timer = setTimeout(start, 600);
      return () => clearTimeout(timer);
    }
  }, [welcomeVisible, welcomeJustClosed, pageReady, shouldShow, start, setWelcomeJustClosed]);

  return { run, steps: stepsData, start, close, complete };
}
