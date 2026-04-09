"use client";

import { useState, useCallback, useMemo } from "react";
import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";
import { ForgeCardSelectModal } from "@/components/forge/ForgeCardSelectModal";
import { ForgeSpinOverlay } from "@/components/forge/ForgeSpinOverlay";
import type { UserCard } from "@/lib/types";

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_CARDS = 5;

/** Success probability keyed by number of cards (1–5). */
const UPGRADE_PROBABILITIES: Record<number, number> = {
  0: 0,
  1: 0.10,
  2: 0.30,
  3: 0.50,
  4: 0.75,
  5: 1.00,
};

type UpgradePhase = "idle" | "spinning" | "done";

// ─── Component ─────────────────────────────────────────────────────────────────

export function ForgeUpgrade() {
  const [cards,            setCards]            = useState<UserCard[]>([]);
  const [upgradePhase,     setUpgradePhase]     = useState<UpgradePhase>("idle");
  const [upgradeResult,    setUpgradeResult]    = useState<"success" | "failure" | null>(null);
  const [pickingSlotIndex, setPickingSlotIndex] = useState(0);
  const [pickOpen,         setPickOpen]         = useState(false);

  const firstCard   = cards[0] ?? null;
  const probability = UPGRADE_PROBABILITIES[Math.min(cards.length, MAX_CARDS)] ?? 0;
  const canUpgrade  = cards.length >= 1 && upgradePhase === "idle";

  const excludeIds = useMemo(
    () => cards.filter((_, i) => i !== pickingSlotIndex).map((c) => c.user_card_id),
    [cards, pickingSlotIndex],
  );

  const openPicker = useCallback((slotIndex: number) => {
    setPickingSlotIndex(slotIndex);
    setPickOpen(true);
  }, []);

  const handleSelectCard = useCallback(
    (card: UserCard) => {
      setCards((prev) => {
        const next = [...prev];
        if (pickingSlotIndex < next.length) {
          // Replacing slot 0 with a different token/rarity resets the whole list
          if (
            pickingSlotIndex === 0 &&
            (card.token_symbol !== prev[0]?.token_symbol ||
              card.rarity_name.trim().toLowerCase() !== prev[0]?.rarity_name.trim().toLowerCase())
          ) {
            return [card];
          }
          next[pickingSlotIndex] = card;
        } else {
          next.push(card);
        }
        return next;
      });
    },
    [pickingSlotIndex],
  );

  const handleReset = useCallback(() => {
    setCards([]);
    setUpgradePhase("idle");
    setUpgradeResult(null);
  }, []);

  const handleUpgrade = useCallback(() => {
    if (!canUpgrade) return;
    // Start animation immediately — result arrives later (from API in production).
    setUpgradeResult(null);
    setUpgradePhase("spinning");
    // TODO: replace with a real API call; call setUpgradeResult() on response
    const result = Math.random() < probability ? "success" : "failure";
    setTimeout(() => setUpgradeResult(result), 12500 + Math.random() * 2500);
  }, [canUpgrade, probability]);

  const handleSpinComplete = useCallback(() => setUpgradePhase("done"), []);

  return (
    <>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
        Select 1 to 5 cards of the same token and rarity. The more cards you add,
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
              onOpenPicker={() => openPicker(idx)}
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
              onOpenPicker={() => openPicker(cards.length)}
              clearLabel=""
            />
          )}
        </div>

        {/* Probability step indicators */}
        <div className="mt-6 flex gap-2 flex-wrap">
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const p      = UPGRADE_PROBABILITIES[n];
            const active = cards.length >= n;
            return (
              <div
                key={n}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-[10px] border text-xs transition-all duration-200"
                style={{
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  background:  active ? "rgba(34,0,239,0.07)" : "transparent",
                  color:       active ? "var(--primary)" : "var(--text-muted)",
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
            Upgrade
          </button>
          {cards.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              disabled={upgradePhase !== "idle"}
              className="py-2.5 px-6 rounded-[15px] text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-ph-capture-attribute-button="forge-upgrade-reset"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Upgrade animation overlay */}
      {(upgradePhase === "spinning" || upgradePhase === "done") && (
        <ForgeSpinOverlay
          result={upgradeResult}
          probability={probability}
          cards={cards}
          // TODO: replace with the real next-rarity card URL from the API
          nextCardImageUrl="https://cdn-uat.hodleague.com/card_renders/card_62_1775617213.webp"
          onSpinComplete={handleSpinComplete}
          onClose={handleReset}
        />
      )}

      {/* Card picker modal */}
      <ForgeCardSelectModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onSelect={handleSelectCard}
        excludeUserCardIds={excludeIds}
        excludeRarityNames={["legendary"]}
        matchTokenSymbol={pickingSlotIndex > 0 ? firstCard?.token_symbol : undefined}
        matchRarityName={pickingSlotIndex > 0 ? firstCard?.rarity_name : undefined}
        title="Select a card"
        subtitle={
          pickingSlotIndex === 0 || !firstCard
            ? "Choose any card — subsequent slots will match its token and rarity."
            : `Only ${firstCard.token_symbol} · ${firstCard.rarity_name} cards allowed here.`
        }
      />
    </>
  );
}
