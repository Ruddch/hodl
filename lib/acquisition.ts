/** Ключ sessionStorage; синхронизирован с ранним inline-скриптом в app/layout.tsx */
export const ACQUISITION_SESSION_KEY = "hodleague_acquisition";

/** Один раз за сессию: событие PostHog campaign_landing уже отправлено */
export const CAMPAIGN_LANDING_SENT_KEY = "hodleague_campaign_landing_sent";

export interface AcquisitionPayload {
  marketing_link_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export function getStoredAcquisitionPayload(): AcquisitionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACQUISITION_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as AcquisitionPayload;
    if (!o || typeof o !== "object") return null;
    const out: AcquisitionPayload = {};
    if (o.marketing_link_id != null && String(o.marketing_link_id).length > 0) {
      out.marketing_link_id = String(o.marketing_link_id);
    }
    if (o.utm_source) out.utm_source = o.utm_source;
    if (o.utm_medium) out.utm_medium = o.utm_medium;
    if (o.utm_campaign) out.utm_campaign = o.utm_campaign;
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function clearStoredAcquisition(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACQUISITION_SESSION_KEY);
}

/** PostHog identify: те же поля, что в API acquisition; fc_ml_id из marketing_link_id. */
export function acquisitionPayloadToPosthogProperties(
  payload: AcquisitionPayload | null | undefined
): Record<string, string> | undefined {
  if (!payload) return undefined;
  const out: Record<string, string> = {};
  if (payload.marketing_link_id) out.fc_ml_id = payload.marketing_link_id;
  if (payload.utm_source) out.utm_source = payload.utm_source;
  if (payload.utm_medium) out.utm_medium = payload.utm_medium;
  if (payload.utm_campaign) out.utm_campaign = payload.utm_campaign;
  return Object.keys(out).length > 0 ? out : undefined;
}
