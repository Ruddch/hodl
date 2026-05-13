"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BlurCard } from "@/components/BlurCard";
import { usePvpDraftOptions, useSubmitPvpDraftPick } from "@/lib/api";
import type { PvpOfferedCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

interface ArcadeDraftProps {
  matchId: number;
  initialStep: number;
  initialPicks: PvpOfferedCard[];
  onComplete: () => void;
}


const TOTAL_SLOTS = 5;
const WEIGHT_LIMIT = 28;

export function ArcadeDraft({ matchId, initialStep, initialPicks, onComplete }: ArcadeDraftProps) {
  const [step, setStep] = useState(initialStep);
  const [picks, setPicks] = useState<PvpOfferedCard[]>(initialPicks);
  const [isPicking, setIsPicking] = useState(false);
  const [pickedCardId, setPickedCardId] = useState<number | null>(null);
  const [dealtCount, setDealtCount] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);
  // Snapshot of cards being animated out — kept alive while collect animation plays
  // so draftData can change (step+1 fetch starts immediately) without breaking the animation
  const [frozenCards, setFrozenCards] = useState<{ offered_cards: PvpOfferedCard[] } | null>(null);

  const { data: draftData } = usePvpDraftOptions(matchId, step);
  const submitPick = useSubmitPvpDraftPick();

  // Start deal animation only when collect animation is done AND new data has arrived
  useEffect(() => {
    if (isCollecting || !draftData) return;
    setDealtCount(0);
    const total = draftData.offered_cards.length;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDealtCount(i);
      if (i >= total) clearInterval(id);
    }, 180);
    return () => clearInterval(id);
  }, [isCollecting, draftData]);

  const currentWeight = picks.reduce((sum, c) => sum + c.weight, 0);

  const handlePick = async (card: PvpOfferedCard) => {
    if (isPicking || !draftData) return;
    setIsPicking(true);
    setPickedCardId(card.card_id);
    setIsCollecting(true);
    setDealtCount(0); // reset synchronously so new cards never flash as "already dealt"
    setFrozenCards({ offered_cards: draftData.offered_cards }); // freeze for animation
    try {
      const result = await submitPick.mutateAsync({
        matchId,
        data: { step, card_id: card.card_id },
      });

      setPicks((prev) => [...prev, card]);

      if (result.resolved || step >= TOTAL_SLOTS) {
        // Last pick — wait for animation then hand off
        await new Promise<void>((resolve) => setTimeout(resolve, 820));
        setIsCollecting(false);
        setFrozenCards(null);
        onComplete();
      } else {
        // Start loading next step immediately (during the ongoing animation)
        setStep(step + 1);
        setIsPicking(false);

        // Wait for collect animation to finish before clearing the selected card —
        // pickedCardId must stay set so the selected card keeps its "fly up" style
        // and doesn't get reassigned the flip animation mid-flight
        await new Promise<void>((resolve) => setTimeout(resolve, 820));
        setIsCollecting(false);
        setFrozenCards(null);
        setPickedCardId(null);
        // useEffect([isCollecting, draftData]) will fire and start deal animation
        // as soon as step+1 data is available (may already be ready)
      }
    } catch {
      setIsCollecting(false);
      setFrozenCards(null);
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
          <div className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 pt-4 pb-2 flex flex-col justify-start sm:justify-center ">
            {/* During collect animation use frozen cards; otherwise use fresh draftData */}
            {(() => {
              const displayData = frozenCards ?? draftData;
              if (!displayData) return null; // empty screen while loading next step
              return (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-8 ">
                {displayData.offered_cards.map((card, index) => {
                    const isDealt = index < dealtCount;
                    const isSelected = pickedCardId === card.card_id;
                  const totalCards = displayData.offered_cards.length;
                  // Right-to-left stagger: rightmost card starts first
                  const reverseIndex = totalCards - 1 - index;
                  const collectDelay = reverseIndex * 55;

                  // Gray out if card doesn't fit: either exceeds total limit,
                  // or leaves no weight budget for remaining slots (each needs ≥ 1)
                  const remainingSlots = TOTAL_SLOTS - step; // slots after this pick
                  const isOverWeight =
                    currentWeight + card.weight + remainingSlots > WEIGHT_LIMIT;
                  const isDisabled = (isPicking && !isSelected) || isOverWeight;

                  // Button handles position + opacity animation
                  let buttonStyle: React.CSSProperties;
                  if (isCollecting && isSelected) {
                    buttonStyle = {
                      aspectRatio: `${CARD_ASPECT_RATIO}`,
                      transform: "scale(0.85) translateY(380%)",
                      opacity: 1,
                      transition: "transform 500ms cubic-bezier(0.4, 0, 1, 1)",
                      perspective: "600px",
                    };
                  } else if (isCollecting) {
                    buttonStyle = {
                      aspectRatio: `${CARD_ASPECT_RATIO}`,
                      // Slide + fade out (no rotateY here — that's on the inner wrapper)
                      animation: `card-collect-slide 520ms ease-in ${collectDelay}ms both`,
                      perspective: "600px",
                    };
                  } else {
                    buttonStyle = {
                      aspectRatio: `${CARD_ASPECT_RATIO}`,
                      transform: isDealt ? "translateY(0) rotate(0deg)" : "translateY(140%) rotate(-18deg)",
                      opacity: isDealt ? 1 : 0,
                      transition: "transform 380ms cubic-bezier(0.34, 1.4, 0.64, 1), opacity 200ms ease",
                    };
                  }

                  return (
                    <button
                      key={card.card_id}
                      type="button"
                      onClick={() => handlePick(card)}
                      disabled={isPicking || isOverWeight || !isDealt}
                      className={[
                        "relative rounded-[10px] sm:rounded-[14px] overflow-visible",
                        isCollecting
                          ? "pointer-events-none"
                          : isSelected
                          ? "ring-2 sm:ring-3 ring-[var(--primary)] ring-offset-2 sm:ring-offset-4 ring-offset-[var(--surface)]"
                          : isDisabled
                          ? "opacity-40 grayscale cursor-not-allowed"
                          : "cursor-pointer border border-[var(--border-subtle)] hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 ring-offset-[var(--surface)]",
                        !isDealt && !isCollecting ? "pointer-events-none" : "",
                      ].join(" ")}
                      style={buttonStyle}
                    >
                      {/* Inner wrapper — handles 3D flip during collection */}
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          transformStyle: "preserve-3d",
                          ...(isCollecting && !isSelected
                            ? { animation: `card-collect-flip 520ms ease-in ${collectDelay}ms both` }
                            : {}),
                        }}
                      >
                        {/* Front face */}
                        <div
                          className="absolute inset-0 rounded-[10px] sm:rounded-[14px] overflow-hidden"
                          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        >
                          {card.rendered_image_url || card.template_image_url ? (
                            <Image
                              src={card.rendered_image_url || card.template_image_url}
                              alt={card.token_name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 33vw, 20vw"
                            />
                          ) : null}
                        </div>
                        {/* Back face — shown after flip */}
                        <div
                          className="absolute inset-0 rounded-[10px] sm:rounded-[14px] overflow-hidden"
                          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                        >
                          <Image
                            src="/card1.png"
                            alt="card back"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 33vw, 20vw"
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              );
            })()}
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
                </div>
              </div>
            </div>
          </div>

        </div>
      </BlurCard>
    </div>
  );
}
