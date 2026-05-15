/**
 * Combat animation tuning constants for the match-result reveal sequence.
 *
 * The flow per slot is:
 *   reveal (flip) → postRevealPause → combat (anticipate → strike → hitStop → recoil → settle)
 *
 * All timings are in milliseconds. Easings are cubic-bezier tuples consumable
 * by Motion's `animate` / `motion.div` `transition.ease`.
 */

export type CubicBezier = [number, number, number, number];

export interface CombatRevealConfig {
  flipMs: number;
  postRevealPauseMs: number;
}

export interface CombatStrikeConfig {
  anticipationMs: number;
  dashMs: number;
  hitStopMs: number;
  recoilMs: number;
  settleMs: number;

  /** How far the winner pulls back before dashing (% of card height). */
  anticipationPullPct: number;
  /** How far the winner travels toward the opponent (% of card height). */
  dashTravelPct: number;
  /** Loser knockback on impact (% of card height, away from opponent). */
  loserRecoilPct: number;
  /** Winner bounce-back after impact (% of card height, away from opponent). */
  winnerRecoilPct: number;

  /** Scale of the winner card during the strike apex. */
  winnerImpactScale: number;
  /** Scale of the loser card during the strike apex. */
  loserImpactScale: number;

  /** Loser shake amplitude in degrees during recoil. */
  loserShakeDeg: number;

  /** Arena screen-shake amplitude in pixels. */
  screenShakePx: number;
  /** Duration of the arena screen-shake. */
  screenShakeMs: number;
}

export interface CombatDrawConfig {
  approachMs: number;
  hitStopMs: number;
  recoilMs: number;
  settleMs: number;

  approachTravelPct: number;
  recoilPct: number;
  impactScale: number;
}

export interface CombatTimelineConfig {
  initialDelayMs: number;
  gapBetweenSlotsMs: number;
  /** Time from "match resolved" to first reveal when there are no slots. */
  cancelledBannerDelayMs: number;
  /** Extra wait after last slot before showing the final banner. */
  bannerTailMs: number;
}

export interface CombatCoinFlipConfig {
  /** Delay after the last slot settles before the coin enters. */
  preDelayMs: number;
  /** Coin entrance (fade + scale-in). */
  entranceMs: number;
  /** Main spin phase, ends roughly aligned with the start of the landing flip. */
  spinMs: number;
  /** Number of full 360° rotations performed during spinMs. */
  fullRotations: number;
  /** Final decel into the winning face. */
  landMs: number;
  /** Hold on the winning face (with flash + screen shake). */
  postHoldMs: number;
  /** Fade-out / scale-down before unmount. */
  exitMs: number;
  /** Arena screen-shake amplitude on coin landing. */
  screenShakePx: number;
  screenShakeMs: number;
  diameterMobile: number;
  diameterDesktop: number;
}

export interface CombatEasings {
  anticipate: CubicBezier;
  strike: CubicBezier;
  recoil: CubicBezier;
  settle: CubicBezier;
  /** Fast start, strong decel — used for the coin-flip spin. */
  spin: CubicBezier;
}

export interface CombatAnimationConfig {
  reveal: CombatRevealConfig;
  strike: CombatStrikeConfig;
  draw: CombatDrawConfig;
  timeline: CombatTimelineConfig;
  coinFlip: CombatCoinFlipConfig;
  easings: CombatEasings;
  /** When true, prefers-reduced-motion shortcuts the combat to a fast fade. */
  respectReducedMotion: boolean;
}

export const COMBAT_ANIMATION: CombatAnimationConfig = {
  reveal: {
    flipMs: 460,
    postRevealPauseMs: 180,
  },
  strike: {
    anticipationMs: 110,
    dashMs: 150,
    hitStopMs: 60,
    recoilMs: 140,
    settleMs: 160,

    anticipationPullPct: 0.08,
    dashTravelPct: 0.42,
    loserRecoilPct: 0.18,
    winnerRecoilPct: 0.12,

    winnerImpactScale: 1.08,
    loserImpactScale: 0.96,

    loserShakeDeg: 4,

    screenShakePx: 5,
    screenShakeMs: 180,
  },
  draw: {
    approachMs: 150,
    hitStopMs: 60,
    recoilMs: 140,
    settleMs: 160,

    approachTravelPct: 0.32,
    recoilPct: 0.16,
    impactScale: 1.04,
  },
  timeline: {
    initialDelayMs: 420,
    gapBetweenSlotsMs: 70,
    cancelledBannerDelayMs: 200,
    bannerTailMs: 380,
  },
  coinFlip: {
    preDelayMs: 300,
    entranceMs: 280,
    spinMs: 1500,
    fullRotations: 7,
    landMs: 320,
    // Hold long enough for the user to register WHICH face landed before
    // the coin exits. Anything below ~800ms feels like a flash.
    postHoldMs: 1100,
    exitMs: 260,
    screenShakePx: 7,
    screenShakeMs: 260,
    diameterMobile: 110,
    diameterDesktop: 150,
  },
  easings: {
    // Smooth wind-up
    anticipate: [0.4, 0.0, 0.6, 1.0],
    // Aggressive, snappy attack
    strike: [0.5, 0.0, 0.2, 1.0],
    // Quick rebound
    recoil: [0.2, 0.8, 0.4, 1.0],
    // Soft settle back to neutral
    settle: [0.25, 0.1, 0.25, 1.0],
    // Fast attack, long smooth decel (feels like a real tossed coin).
    spin: [0.16, 1.0, 0.3, 1.0],
  },
  respectReducedMotion: true,
};

/** Total duration of a single slot's combat phase (strike or draw, whichever is longer). */
export function getCombatTotalMs(cfg: CombatAnimationConfig = COMBAT_ANIMATION): number {
  const s = cfg.strike;
  const d = cfg.draw;
  const strikeTotal = s.anticipationMs + s.dashMs + s.hitStopMs + s.recoilMs + s.settleMs;
  const drawTotal = d.approachMs + d.hitStopMs + d.recoilMs + d.settleMs;
  return Math.max(strikeTotal, drawTotal);
}

/** Time from "resolved" to the moment slot `i` finishes its combat. */
export function getSlotCombatEndMs(
  i: number,
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
): number {
  const { initialDelayMs, gapBetweenSlotsMs } = cfg.timeline;
  const { flipMs, postRevealPauseMs } = cfg.reveal;
  const combatTotal = getCombatTotalMs(cfg);
  const slotCycle = flipMs + postRevealPauseMs + combatTotal + gapBetweenSlotsMs;
  return initialDelayMs + i * slotCycle + (flipMs + postRevealPauseMs + combatTotal);
}

/** Time from "resolved" to the flip start of slot `i`. */
export function getSlotFlipStartMs(
  i: number,
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
): number {
  const { initialDelayMs, gapBetweenSlotsMs } = cfg.timeline;
  const { flipMs, postRevealPauseMs } = cfg.reveal;
  const combatTotal = getCombatTotalMs(cfg);
  const slotCycle = flipMs + postRevealPauseMs + combatTotal + gapBetweenSlotsMs;
  return initialDelayMs + i * slotCycle;
}

/** Time from "resolved" to the combat start of slot `i`. */
export function getSlotCombatStartMs(
  i: number,
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
): number {
  return getSlotFlipStartMs(i, cfg) + cfg.reveal.flipMs + cfg.reveal.postRevealPauseMs;
}

export interface RevealTotalOptions {
  /** Add the coin-flip overlay duration to the total reveal window. */
  withCoinFlip?: boolean;
}

/** Total time to fully reveal `n` slots (plus optional coin-flip). */
export function getRevealTotalMs(
  n: number,
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
  opts: RevealTotalOptions = {},
): number {
  if (n <= 0) return 0;
  const slotsTail = getSlotCombatEndMs(n - 1, cfg) + cfg.timeline.bannerTailMs;
  if (opts.withCoinFlip) return slotsTail + getCoinFlipTotalMs(cfg);
  return slotsTail;
}

/** Total runtime of the coin-flip overlay sequence. */
export function getCoinFlipTotalMs(
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
): number {
  const c = cfg.coinFlip;
  return c.preDelayMs + c.entranceMs + c.spinMs + c.landMs + c.postHoldMs + c.exitMs;
}

/** Absolute timestamp (from "resolved") when the coin overlay should be triggered. */
export function getCoinFlipStartMs(
  n: number,
  cfg: CombatAnimationConfig = COMBAT_ANIMATION,
): number {
  if (n <= 0) return cfg.coinFlip.preDelayMs;
  return getSlotCombatEndMs(n - 1, cfg) + cfg.coinFlip.preDelayMs;
}
