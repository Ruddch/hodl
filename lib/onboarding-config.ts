import type { OnboardingConfig } from "./onboarding-types";

/** Онбординг для страницы турниров */
export const TOURNAMENT_ONBOARDING: OnboardingConfig = [
  {
    target: "[data-onboarding='tournament-card']",
    title: "Tournament Card",
    content:
      "Tournaments run weekly. Registration opens every Friday at 17:00 UTC and closes Monday at 17:00 UTC — that's when the tournament starts. Come back and register using this button.",
    placement: "bottom",
    spotlightRadius: 16,
  },
  {
    target: "[data-onboarding='deck']",
    title: "My Deck",
    content:
      "Build your deck from collected cards and choose the strongest combination to compete. You can adjust your lineup anytime before the tournament starts on Monday at 17:00 UTC.",
    placement: "top",
    spotlightRadius: 30,
  },
  {
    target: "[data-onboarding='leaderboard-preview']",
    title: "Leaderboard",
    content:
      "Track your deck's performance and compete with other players. The higher your deck scores, the higher you rank. Climb to the top to earn rewards.",
    placement: "top",
    spotlightRadius: 30,
  },
];

/** Онбординг для страницы паков */
export const PACKS_ONBOARDING: OnboardingConfig = [
  {
    target: "[data-onboarding='packs-section']",
    title: "Weekly Packs",
    content:
      "You receive 5 new packs every week after the tournament ends during the beta. Cards inside are exclusive to the upcoming tournament—open them and start building your next deck.",
    placement: "top",
    spotlightRadius: 30,
  },
  {
    target: "[data-onboarding='open-packs-btn']",
    title: "Open Packs",
    content:
      "Click here to open your packs and reveal new cards one by one. Each pack contains 5 tokens ready to join your lineup.",
    placement: "top",
    spotlightRadius: 15,
  },
];

/** Онбординг для страницы профиля */
export const PROFILE_ONBOARDING: OnboardingConfig = [
  
];
