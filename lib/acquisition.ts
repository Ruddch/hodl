/** Ключ sessionStorage; синхронизирован с ранним inline-скриптом в app/layout.tsx */
export const ACQUISITION_SESSION_KEY = "hodleague_acquisition";

export interface AcquisitionPayload {
  marketing_link_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

/**
 * Записывает в sessionStorage только поля из текущего query (utm_*, fc_ml_id → marketing_link_id).
 * Без мерджа: объект целиком из этого URL (только непустые поля).
 */
export function setAcquisitionFromSearchString(search: string): void {
  if (typeof window === "undefined") return;
  const trimmed = search.startsWith("?") ? search.slice(1) : search;
  if (!trimmed) return;

  const params = new URLSearchParams(trimmed);
  const payload: Partial<AcquisitionPayload> = {};

  const us = params.get("utm_source");
  if (us) payload.utm_source = us;

  const um = params.get("utm_medium");
  if (um) payload.utm_medium = um;

  const uc = params.get("utm_campaign");
  if (uc) payload.utm_campaign = uc;

  const ml = params.get("fc_ml_id");
  if (ml) payload.marketing_link_id = ml;

  if (Object.keys(payload).length === 0) return;

  sessionStorage.setItem(ACQUISITION_SESSION_KEY, JSON.stringify(payload));
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
