"use client";

import { useState } from "react";
import Image from "next/image";
import { BlurCard } from "@/components/BlurCard";
import { usePvpDraftOptions, useSubmitPvpDraftPick } from "@/lib/api";
import type { PvpOfferedCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

interface ArcadeDraftProps {
  matchId: number;
  step: number;
  picks: PvpOfferedCard[];
  onNextStep: (nextStep: number, pick: PvpOfferedCard) => void;
  onComplete: (lastPick: PvpOfferedCard) => void;
}

function weightColor(weight: number): string {
  if (weight >= 8) return "#22c55e";
  if (weight >= 5) return "#eab308";
  return "#ef4444";
}

const TOTAL_SLOTS = 5;
const WEIGHT_LIMIT = 28;

export function ArcadeDraft({ matchId, step, picks, onNextStep, onComplete }: ArcadeDraftProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [pickedCardId, setPickedCardId] = useState<number | null>(null);

  const { data: draftData, isLoading } = usePvpDraftOptions(matchId, step);
  const submitPick = useSubmitPvpDraftPick();

  const currentWeight = picks.reduce((sum, c) => sum + c.weight, 0);

  const handlePick = async (card: PvpOfferedCard) => {
    if (isPicking) return;
    setIsPicking(true);
    setPickedCardId(card.card_id);
    try {
      const result = await submitPick.mutateAsync({
        matchId,
        data: { step, card_id: card.card_id },
      });
      if (result.resolved || step >= TOTAL_SLOTS) {
        onComplete(card);
      } else {
        setIsPicking(false);
        setPickedCardId(null);
        onNextStep(step + 1, card);
      }
    } catch {
      setIsPicking(false);
      setPickedCardId(null);
    }
  };

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgba(167, 139, 250, 1)" className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col h-full min-h-0">

          {/* Header + progress */}
          <div className="flex flex-col gap-3 px-4 sm:px-6 pt-4 md:pt-6 shrink-0">
            <div className="flex items-center justify-between">
              <h2
                className="text-3xl text-[var(--text-primary)] tracking-wide uppercase leading-none"
                style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
              >
                Token Duel
              </h2>
              <span className="text-xs text-[var(--text-muted)]">Match #{matchId}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Choose token for slot {step}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{step} / {TOTAL_SLOTS}</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className="flex-1 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        s < step
                          ? "var(--primary)"
                          : s === step
                          ? "rgba(139, 92, 246, 0.6)"
                          : "var(--border-subtle)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card grid — centered vertically */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col justify-center">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-[10px] sm:rounded-[14px] bg-[var(--surface-elevated)] animate-pulse"
                    style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                  />
                ))}
              </div>
            ) : draftData ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-8 sm:gap-x-4 sm:gap-y-10">
                {draftData.offered_cards.map((card) => {
                    const isSelected = pickedCardId === card.card_id;
                  // Gray out if card doesn't fit: either exceeds total limit,
                  // or leaves no weight budget for remaining slots (each needs ≥ 1)
                  const remainingSlots = TOTAL_SLOTS - step; // slots after this pick
                  const isOverWeight =
                    currentWeight + card.weight + remainingSlots > WEIGHT_LIMIT;
                  const isDisabled = (isPicking && !isSelected) || isOverWeight;

                  return (
                    <button
                      key={card.card_id}
                      type="button"
                      onClick={() => handlePick(card)}
                      disabled={isPicking || isOverWeight}
                      className={[
                        "relative rounded-[10px] sm:rounded-[14px] overflow-visible transition-all",
                        isSelected
                          ? "ring-2 sm:ring-3 ring-[var(--primary)] ring-offset-2 sm:ring-offset-4 ring-offset-[var(--surface)]"
                          : isDisabled
                          ? "opacity-40 grayscale cursor-not-allowed"
                          : "cursor-pointer border border-[var(--border-subtle)] hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 ring-offset-[var(--surface)]",
                      ].join(" ")}
                      style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                    >
                      {/* Card image */}
                      <div className="w-full h-full rounded-[10px] sm:rounded-[14px] overflow-hidden">
                        {card.rendered_image_url || card.template_image_url ? (
                          <Image
                            src={card.rendered_image_url || card.template_image_url}
                            alt={card.token_name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 33vw, 20vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-hover)] flex flex-col items-center justify-center p-2">
                            <span className="text-xs font-bold text-[var(--text-primary)] text-center">
                              {card.token_symbol}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-[var(--text-muted)]">Failed to load options. Please refresh.</p>
              </div>
            )}
          </div>

          {/* Footer — picks floating above, weight bar below */}
          <div className="relative shrink-0">
            {/* Floating card slots — same pattern as DeckPackFooter */}
            <div className="absolute left-3 sm:left-6 right-3 sm:right-auto bottom-full mb-[-15px] sm:mb-[-60px] flex items-end gap-[5px] md:gap-[13px] z-10 pb-1 pointer-events-none">
              {Array.from({ length: TOTAL_SLOTS }).map((_, index) => {
                const card = picks[index];
                return (
                  <div
                    key={index}
                    className="relative w-[calc(18%-4px)] md:w-[90px] flex-shrink-0 rounded-lg sm:rounded-xl pointer-events-auto"
                    style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                  >
                    {card ? (
                      <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden">
                        {card.rendered_image_url || card.template_image_url ? (
                          <Image
                            src={card.rendered_image_url || card.template_image_url}
                            alt={card.token_name}
                            fill
                            className="object-cover"
                            sizes="10vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center">
                            <span className="text-xs text-[var(--text-muted)]">{card.token_symbol}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--badge-purple-muted)] backdrop-blur-xl flex items-center justify-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer bar */}
            <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 sm:px-8 py-4 sm:py-5">
              <div className="flex items-end justify-end">
                <div className="flex flex-col w-full sm:max-w-[470px] gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm sm:text-base font-semibold text-[var(--text-primary)]">
                      Weight of the set
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {currentWeight}/{WEIGHT_LIMIT}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((currentWeight / WEIGHT_LIMIT) * 100, 100)}%`,
                        backgroundColor: "var(--primary)",
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{picks.length} cards selected</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </BlurCard>
    </div>
  );
}
