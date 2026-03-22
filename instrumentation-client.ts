import posthog from "posthog-js";
import { isPosthogEnabled } from "./lib/posthog-enabled";

if (typeof window !== "undefined" && isPosthogEnabled()) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_TOKEN!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://e.hodleague.com",
    defaults: '2026-01-30'
  });
}
