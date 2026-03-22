"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import {
  acquisitionPayloadToPosthogProperties,
  CAMPAIGN_LANDING_SENT_KEY,
  getStoredAcquisitionPayload,
} from "@/lib/acquisition";
import { isPosthogEnabled } from "@/lib/posthog-enabled";

/**
 * Маркетинговые ссылки ведут на полную загрузку страницы; query в sessionStorage уже кладёт inline-скрипт в layout.
 * Здесь только один раз за сессию шлём campaign_landing в PostHog, если есть fc_ml_id.
 */
export function AcquisitionCapture() {
  useEffect(() => {
    if (typeof window === "undefined" || !isPosthogEnabled()) return;
    if (sessionStorage.getItem(CAMPAIGN_LANDING_SENT_KEY)) return;

    const stored = getStoredAcquisitionPayload();
    if (!stored?.marketing_link_id) return;

    const props = acquisitionPayloadToPosthogProperties(stored);
    if (!props?.fc_ml_id) return;

    sessionStorage.setItem(CAMPAIGN_LANDING_SENT_KEY, "1");
    posthog.capture("campaign_landing", props);
  }, []);

  return null;
}
