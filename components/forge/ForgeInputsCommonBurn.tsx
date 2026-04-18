"use client";

import { Fragment, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";
import { DustIcon } from "@/components/Icons";
import { FORGE_COMMON_BURN_DUST_REWARD } from "@/lib/forge";
import type { UserCard } from "@/lib/types";

const CardBurnAnimation = dynamic(
  () => import("@/components/forge/CardBurnAnimation").then((m) => m.CardBurnAnimation),
  { ssr: false }
);

function cardTextureUrl(card: UserCard): string {
  return card.rendered_image_url || card.token_image_url || "/packs.png";
}

interface ForgeInputsCommonBurnProps {
  cards: UserCard[];
  burnPlaying: boolean;
  burnOverlayReady: boolean;
  burnTxLoading: boolean;
  canBurn: boolean;
  onOpenSlot: () => void;
  onClearSlot: (slotIndex: number) => void;
  onResetAll: () => void;
  onBurn: () => void;
  onBurnVisualReady: () => void;
  onBurnAnimationComplete: () => void;
}

/** Common: сетка слотов (auto-fill + перенос строк), Burn/Reset, текст под кнопками */
export function ForgeInputsCommonBurn({
  cards,
  burnPlaying,
  burnOverlayReady,
  burnTxLoading,
  canBurn,
  onOpenSlot,
  onClearSlot,
  onResetAll,
  onBurn,
  onBurnVisualReady,
  onBurnAnimationComplete,
}: ForgeInputsCommonBurnProps) {
  const totalDust = FORGE_COMMON_BURN_DUST_REWARD * cards.length;
  const trailingEmptyIndex = cards.length;

  const burnReadyCountRef = useRef(0);
  const burnCompleteCountRef = useRef(0);

  useEffect(() => {
    if (burnPlaying) {
      burnReadyCountRef.current = 0;
      burnCompleteCountRef.current = 0;
    }
  }, [burnPlaying]);

  const handleBurnSlotVisualReady = useCallback(() => {
    burnReadyCountRef.current += 1;
    if (burnReadyCountRef.current >= cards.length) {
      onBurnVisualReady();
    }
  }, [cards.length, onBurnVisualReady]);

  const handleBurnSlotComplete = useCallback(() => {
    burnCompleteCountRef.current += 1;
    if (burnCompleteCountRef.current >= cards.length) {
      onBurnAnimationComplete();
    }
  }, [cards.length, onBurnAnimationComplete]);

  return (
    <>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
        Burn common cards in the forge. You earn{" "}
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
          {FORGE_COMMON_BURN_DUST_REWARD}
        </span>{" "}
        <DustIcon className="inline-block h-[1em] w-[1em] align-[-0.15em] mx-0.5 text-[var(--text-primary)]" aria-hidden />
        dust for each common card you burn.
      </p>
      <div className="border-t border-[var(--border-subtle)] pt-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] mb-4">Inputs</p>

        {/* pt/px — запас под крестики слотов; сетка без лимита ширины, колонки по auto-fill */}
        <div className="grid w-full [grid-template-columns:repeat(auto-fill,minmax(148px,max-content))] sm:[grid-template-columns:repeat(auto-fill,minmax(168px,max-content))] gap-x-3 gap-y-8 pt-3 pb-2 px-1">
          {cards.map((card, index) => (
            <Fragment key={card.user_card_id}>
              <div className="relative w-[148px] sm:w-[168px]">
                <ForgeSlotBox
                  filled={card}
                  emptyLabel={`Slot ${index + 1}`}
                  onOpenPicker={onOpenSlot}
                  onClear={() => onClearSlot(index)}
                  clearLabel={cards.length === 1 ? "Clear forge" : "Remove"}
                  visualEmpty={burnPlaying && burnOverlayReady}
                />
                {burnPlaying ? (
                  <CardBurnAnimation
                    key={card.user_card_id}
                    imageUrl={cardTextureUrl(card)}
                    imageCacheBust={card.user_card_id}
                    active={burnPlaying}
                    overlay
                    onBurnVisualReady={handleBurnSlotVisualReady}
                    onComplete={handleBurnSlotComplete}
                  />
                ) : null}
              </div>
            </Fragment>
          ))}

          <div className="relative w-[148px] sm:w-[168px]">
            <ForgeSlotBox
              filled={null}
              emptyLabel={`Slot ${trailingEmptyIndex + 1}`}
              onOpenPicker={onOpenSlot}
              clearLabel="Clear forge"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBurn}
          disabled={burnPlaying || burnTxLoading || !canBurn}
          className="py-2.5 px-8 rounded-[15px] text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 transition-opacity shadow-[0px_4px_12px_0px_rgba(74,106,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          data-ph-capture-attribute-button="forge-burn"
        >
          {burnTxLoading ? "Working…" : "Burn"}
        </button>
        <button
          type="button"
          onClick={onResetAll}
          disabled={burnPlaying || burnTxLoading}
          className="py-2.5 px-6 rounded-[15px] text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-ph-capture-attribute-button="forge-reset"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 max-w-xl text-sm text-[var(--text-muted)] leading-relaxed">
        <p>
          {cards.length > 1 ? (
            <>
              This burn will grant{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                <span className="tabular-nums">{totalDust}</span>
                <DustIcon className="h-[1em] w-[1em] shrink-0" aria-hidden />
              </span>{" "}
              in total.
            </>
          ) : (
            <>
              Burning this card grants{" "}
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                <span className="tabular-nums">{FORGE_COMMON_BURN_DUST_REWARD}</span>
                <DustIcon className="h-[1em] w-[1em] shrink-0" aria-hidden />
              </span>{" "}
              dust.
            </>
          )}
        </p>
      </div>
    </>
  );
}
