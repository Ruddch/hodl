"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useAccount } from "wagmi";
import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";
import { ForgeCardSelectModal } from "@/components/forge/ForgeCardSelectModal";
import { ForgeSpinOverlay } from "@/components/forge/ForgeSpinOverlay";
import type { UserCard } from "@/lib/types";
import { useCardUpgrade } from "@/lib/hooks/useCardUpgrade";

const MIN_ANIM_MS = 5000;

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_CARDS = 5;

/** Success probability keyed by number of cards (1–5). */
const UPGRADE_PROBABILITIES: Record<number, number> = {
  0: 0,
  1: 0.10,
  2: 0.35,
  3: 0.55,
  4: 0.75,
  5: 1.00,
};

type UpgradePhase = "idle" | "spinning" | "done";

// ─── Component ─────────────────────────────────────────────────────────────────

export function ForgeUpgrade() {
  const { chainId: walletChainId } = useAccount();

  const [cards,            setCards]            = useState<UserCard[]>([]);
  const [upgradePhase,     setUpgradePhase]     = useState<UpgradePhase>("idle");
  const [upgradeResult,    setUpgradeResult]    = useState<"success" | "failure" | null>(null);
  const [nextCardImageUrl, setNextCardImageUrl] = useState<string | undefined>(undefined);
  const [upgradeError,     setUpgradeError]     = useState<string | null>(null);
  const [pickOpen,         setPickOpen]         = useState(false);

  const firstCard   = cards[0] ?? null;
  const probability = UPGRADE_PROBABILITIES[Math.min(cards.length, MAX_CARDS)] ?? 0;
  const animStartedAtRef = useRef<number | null>(null);

  const { startUpgrade, step: upgradeStep, isLoading: upgradeLoading, reset: resetUpgrade } = useCardUpgrade({
    onPrepared: (data) => {
      setNextCardImageUrl(data.outcome_card_image_url);
    },
    onTxSubmitted: () => {
      animStartedAtRef.current = Date.now();
      setUpgradePhase("spinning");
    },
    onSuccess: (result) => {
      const elapsed   = animStartedAtRef.current != null ? Date.now() - animStartedAtRef.current : MIN_ANIM_MS;
      const remaining = Math.max(0, MIN_ANIM_MS - elapsed);
      setTimeout(() => {
        setUpgradeResult(result.roll_success ? "success" : "failure");
      }, remaining);
    },
    onError: (err) => {
      setUpgradePhase("idle");
      setUpgradeError(err.message);
    },
  });

  const canUpgrade = cards.length >= 2 && upgradePhase === "idle" && !upgradeLoading;

  // Returns true if a card is incompatible with the current selection
  // (different token or rarity from the first selected card)
  const multiDisabled = useCallback(
    (card: UserCard): boolean => {
      if (!firstCard) return false;
      return (
        card.token_symbol.toLowerCase() !== firstCard.token_symbol.toLowerCase() ||
        card.rarity_name.trim().toLowerCase() !== firstCard.rarity_name.trim().toLowerCase()
      );
    },
    [firstCard],
  );

  const multiSelectedIds = useMemo(
    () => cards.map((c) => c.user_card_id),
    [cards],
  );

  const handleMultiToggle = useCallback((card: UserCard) => {
    setCards((prev) => {
      const isSelected = prev.some((c) => c.user_card_id === card.user_card_id);
      if (isSelected) {
        return prev.filter((c) => c.user_card_id !== card.user_card_id);
      }
      if (prev.length >= MAX_CARDS) return prev;
      return [...prev, card];
    });
  }, []);

  const handleReset = useCallback(() => {
    resetUpgrade();
    setCards([]);
    setUpgradePhase("idle");
    setUpgradeResult(null);
    setNextCardImageUrl(undefined);
    setUpgradeError(null);
    animStartedAtRef.current = null;
  }, [resetUpgrade]);

  const handleUpgrade = useCallback(async () => {
    if (!canUpgrade || !firstCard) return;

    const chainId = firstCard.chain_id ?? walletChainId;
    if (!chainId) {
      setUpgradeError("Unable to detect network. Please connect your wallet.");
      return;
    }

    setUpgradeResult(null);
    setNextCardImageUrl(undefined);
    setUpgradeError(null);

    await startUpgrade({
      user_card_ids: cards.map((c) => c.user_card_id),
      chain_id: chainId,
    });
  }, [canUpgrade, firstCard, walletChainId, cards, startUpgrade]);

  const handleSpinComplete = useCallback(() => setUpgradePhase("done"), []);

  return (
    <>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
        Select 2 to 5 cards of the same token and rarity. The more cards you add,
        the higher your chance of a successful upgrade.
      </p>

      <div className="border-t border-[var(--border-subtle)] pt-5">
        {/* Card counter + hint */}
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Cards
          </p>
          <span className="text-[11px] font-semibold text-[var(--text-primary)] tabular-nums">
            {cards.length}/{MAX_CARDS}
          </span>
        </div>
        {firstCard ? (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Only{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {firstCard.token_symbol} · {firstCard.rarity_name}
            </span>{" "}
            cards can be added to the remaining slots.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Pick any card to start — subsequent slots will be locked to the same token and rarity.
          </p>
        )}

        {/* Slot grid */}
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(148px,max-content))] sm:[grid-template-columns:repeat(auto-fill,minmax(168px,max-content))] gap-x-3 gap-y-8 pt-3 pb-2 px-1">
          {cards.map((card, idx) => (
            <ForgeSlotBox
              key={card.user_card_id}
              filled={card}
              emptyLabel={`Slot ${idx + 1}`}
              onOpenPicker={() => setPickOpen(true)}
              onClear={() =>
                setCards((p) => {
                  const next = p.filter((_, i) => i !== idx);
                  return idx === 0 ? [] : next;
                })
              }
              clearLabel="Remove"
            />
          ))}
          {cards.length < MAX_CARDS && (
            <ForgeSlotBox
              filled={null}
              emptyLabel={`Slot ${cards.length + 1}`}
              onOpenPicker={() => setPickOpen(true)}
              clearLabel=""
            />
          )}
        </div>

        {/* Probability step indicators */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {([2, 3, 4, 5] as const).map((n) => {
            const p      = UPGRADE_PROBABILITIES[n];
            const active = cards.length >= n;
            return (
              <div
                key={n}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-[10px] border text-xs transition-all duration-200"
                style={{
                  borderColor: active ? "var(--primary)" : "rgba(255,255,255,0.18)",
                  background:  active ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.05)",
                  color:       active ? "#a5b4fc" : "rgba(255,255,255,0.65)",
                }}
              >
                <span className="font-bold text-[13px] tabular-nums">
                  {Math.round(p * 100)}%
                </span>
                <span className="text-[10px] opacity-70">
                  {n} card{n > 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={!canUpgrade}
            className="py-2.5 px-8 rounded-[15px] text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 transition-opacity shadow-[0px_4px_12px_0px_rgba(74,106,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            data-ph-capture-attribute-button="forge-upgrade"
          >
            {upgradeStep === "preparing" ? "Preparing…"
              : upgradeStep === "signing" ? "Sign in wallet…"
              : "Upgrade"}
          </button>
          {cards.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              disabled={upgradePhase !== "idle" || upgradeLoading}
              className="py-2.5 px-6 rounded-[15px] text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-ph-capture-attribute-button="forge-upgrade-reset"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Upgrade error */}
      {upgradeError && upgradePhase === "idle" && (
        <p className="mt-4 text-sm text-red-400">{upgradeError}</p>
      )}

      {/* Upgrade animation overlay */}
      {(upgradePhase === "spinning" || upgradePhase === "done") && (
        <ForgeSpinOverlay
          result={upgradeResult}
          probability={probability}
          cards={cards}
          nextCardImageUrl={nextCardImageUrl}
          onSpinComplete={handleSpinComplete}
          onClose={handleReset}
        />
      )}

      {/* Card picker modal — multi-select */}
      <ForgeCardSelectModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        multiSelect
        multiSelectedIds={multiSelectedIds}
        onMultiToggle={handleMultiToggle}
        maxMultiSelect={MAX_CARDS}
        multiDisabled={multiDisabled}
        excludeRarityNames={["legendary"]}
        minCopiesRequired={cards.length === 0 ? 2 : undefined}
        title="Select cards to upgrade"
        subtitle={
          !firstCard
            ? "Choose any card to start — others will be filtered to the same token and rarity."
            : `Only ${firstCard.token_symbol} · ${firstCard.rarity_name} cards are compatible.`
        }
      />
    </>
  );
}
