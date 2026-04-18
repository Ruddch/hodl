"use client";

import { useId, useMemo, useCallback } from "react";
import { useCards } from "@/lib/api";
import { useFeatureFlag } from "@/lib/hooks/useFeatureFlag";
import type { UserCard } from "@/lib/types";

const DECK_SIZE = 5;

const RARITY_ORDER: Record<string, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

interface AiDeckFillButtonProps {
  /** Карты доступные для выбора (не заблокированные, не занятые в других колодах) */
  availableCards: UserCard[];
  weightLimit: number;
  onFill: (cards: UserCard[]) => void;
  disabled?: boolean;
}

export function AiDeckFillButton({
  availableCards,
  weightLimit,
  onFill,
  disabled,
}: AiDeckFillButtonProps) {
  const enabled = useFeatureFlag("ai_deck_fill");
  const clipId = useId();

  const { data: catalogData } = useCards();

  const marketCapBySymbol = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of catalogData?.cards ?? []) {
      if (card.market_cap != null && !map.has(card.token_symbol)) {
        map.set(card.token_symbol, card.market_cap);
      }
    }
    return map;
  }, [catalogData]);

  const autoFillDeck = useCallback(() => {
    // Для каждого уникального токена берём карту с наивысшей редкостью
    const bySymbol = new Map<string, UserCard>();
    for (const card of availableCards) {
      const existing = bySymbol.get(card.token_symbol);
      if (!existing) {
        bySymbol.set(card.token_symbol, card);
      } else {
        const existRank = RARITY_ORDER[existing.rarity_name?.trim().toLowerCase()] ?? 99;
        const curRank = RARITY_ORDER[card.rarity_name?.trim().toLowerCase()] ?? 99;
        if (curRank < existRank) bySymbol.set(card.token_symbol, card);
      }
    }

    // Сортируем по market_cap убыв., при равной — по редкости
    const candidates = Array.from(bySymbol.values()).sort((a, b) => {
      const mcA = marketCapBySymbol.get(a.token_symbol) ?? 0;
      const mcB = marketCapBySymbol.get(b.token_symbol) ?? 0;
      if (mcB !== mcA) return mcB - mcA;
      const rA = RARITY_ORDER[a.rarity_name?.trim().toLowerCase()] ?? 99;
      const rB = RARITY_ORDER[b.rarity_name?.trim().toLowerCase()] ?? 99;
      return rA - rB;
    });

    // Жадный алгоритм: берём карту с наибольшей market_cap, если вписывается в лимит
    const result: UserCard[] = [];
    let usedWeight = 0;
    for (const card of candidates) {
      if (result.length >= DECK_SIZE) break;
      if (usedWeight + card.token_weight <= weightLimit) {
        result.push(card);
        usedWeight += card.token_weight;
      }
    }

    onFill(result);
  }, [availableCards, marketCapBySymbol, weightLimit, onFill]);

  if (!enabled) return null;

  return (
    <button
      onClick={autoFillDeck}
      disabled={disabled}
      data-ph-capture-attribute-button="deck-selection-ai-fill"
      className="self-start w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:cursor-not-allowed text-[var(--primary)] [background-color:var(--icon-button-bg)] [border-color:var(--icon-button-border)] [border-width:1px] hover:[background-color:var(--icon-button-hover)] disabled:opacity-40"
      aria-label="Auto-fill deck with AI"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id={clipId}>
            <rect width="18" height="18" fill="white" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M9 2L10.545 6.455L15 8L10.545 9.545L9 14L7.455 9.545L3 8L7.455 6.455L9 2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 11.5L15.25 13.25L17 14L15.25 14.75L14.5 16.5L13.75 14.75L12 14L13.75 13.25L14.5 11.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </button>
  );
}
