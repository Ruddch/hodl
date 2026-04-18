"use client";

import { useState, useEffect } from "react";

/**
 * Читает feature-флаг из localStorage.
 *
 * Включить флаг в DevTools:
 *   localStorage.setItem("ff_<name>", "true")
 * Выключить:
 *   localStorage.removeItem("ff_<name>")
 *
 * Флаг читается один раз при монтировании компонента.
 * Чтобы изменения вступили в силу — перезагрузи страницу.
 */
export function useFeatureFlag(name: string): boolean {
  const key = `ff_${name}`;

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(localStorage.getItem(key) === "true");
    } catch {
      setEnabled(false);
    }
  }, [key]);

  return enabled;
}
