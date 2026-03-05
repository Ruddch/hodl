/**
 * Aspect ratio для карточек (width / height)
 * Соответствует реальным размерам карт: 567px × 889px
 */
export const CARD_ASPECT_RATIO = 567 / 889;

/** Режим Avax-only (без Abstract blockchain и AGW) */
export const IS_AVAX = process.env.NEXT_PUBLIC_ENV === "avax";

/** Базовый URL API */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_ENV === "avax"
    ? "https://avax.back.hodleague.com"
    : process.env.NEXT_PUBLIC_ENV === "development"
      ? "https://uat.hodleague.com"
      : "https://back.hodleague.com";

/** basePath без trailing slash (для редиректов и скриптов) */
export const BASE_PATH =
  (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "") || "";
