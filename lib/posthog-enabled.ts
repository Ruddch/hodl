/**
 * PostHog только в production-сборке (`next build` / `next start`).
 * В `next dev` аналитика отключена, даже если задан NEXT_PUBLIC_POSTHOG_TOKEN.
 */
export function isPosthogEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ENV !== "production") return false;
  const token = process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
  return typeof token === "string" && token.length > 0;
}
