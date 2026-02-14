import type { OnboardingConfig } from "./onboarding-types";

/** Онбординг для страницы турниров */
export const TOURNAMENT_ONBOARDING: OnboardingConfig = [
  {
    target: "[data-onboarding='tournament-card']",
    title: "Tournaments",
    content: "Every 5 days a new tournament starts. Here you can register and claim rewards.",
    placement: "bottom",
    spotlightRadius: 16,
  },
  {
    target: "[data-onboarding='deck']",
    title: "Your Deck",
    content: "Build your deck from collected cards. Choose the strongest combination to compete.",
    placement: "bottom",
    spotlightRadius: 30,
  },
  {
    target: "[data-onboarding='leaderboard-preview']",
    title: "Leaderboard",
    content: "Track your rank and compete with other players. Climb to the top to earn rewards.",
    placement: "top",
    spotlightRadius: 30,
  },
];

/** Онбординг для страницы паков */
export const PACKS_ONBOARDING: OnboardingConfig = [
  {
    target: "[data-onboarding='packs-section']",
    title: "My Packs",
    content: "In beta you get 5 new packs every week. Open them to collect cards for tournaments.",
    placement: "top",
    spotlightRadius: 30,
  },
  {
    target: "[data-onboarding='open-packs-btn']",
    title: "Open Packs",
    content: "Click here to open your packs and reveal new cards. Add them to your deck!",
    placement: "top",
    spotlightRadius: 15,
  },
];

/** Онбординг для страницы профиля */
export const PROFILE_ONBOARDING: OnboardingConfig = [
  {
    target: "[data-onboarding='profile-stats']",
    title: "Your Stats",
    content: "Track your balance, best score, and tournament results here.",
    placement: "bottom",
    spotlightRadius: 16,
  },
  {
    target: "[data-onboarding='profile-cards']",
    title: "Your Cards",
    content: "View all cards you've collected. Tap a card to see its details and stats.",
    placement: "top",
    spotlightRadius: 30,
  },
];
