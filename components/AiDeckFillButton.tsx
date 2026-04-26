"use client";

import { useId, useCallback } from "react";
import { useSuggestTournamentDeck } from "@/lib/api";
import type { UserCard } from "@/lib/types";

interface AiDeckFillButtonProps {
  tournamentId: number | undefined;
  /** Все карты пользователя (для сопоставления full_deck с сущностями) */
  allUserCards: UserCard[];
  /** Уже выбранные в колоде id — бэкенд дозаполняет лучшей пятёркой */
  selectedUserCardIds: number[];
  onFill: (cards: UserCard[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function AiDeckFillButton({
  tournamentId,
  allUserCards,
  selectedUserCardIds,
  onFill,
  onError,
  disabled,
}: AiDeckFillButtonProps) {
  const clipId = useId();
  const { mutateAsync, isPending } = useSuggestTournamentDeck();

  const handleClick = useCallback(async () => {
    if (tournamentId == null) return;
    try {
      const res = await mutateAsync({
        tournamentId,
        data: { selected_user_card_ids: selectedUserCardIds },
      });
      const byId = new Map(allUserCards.map((c) => [c.user_card_id, c]));
      const full = res.full_deck
        .map((id) => byId.get(id))
        .filter((c): c is UserCard => c != null);
      if (full.length !== res.full_deck.length) {
        onError?.(
          "Not all cards from the suggestion are in your collection. Try refreshing the page.",
        );
        return;
      }
      onFill(full);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Suggestion failed");
    }
  }, [tournamentId, selectedUserCardIds, allUserCards, onFill, onError, mutateAsync]);

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={disabled || isPending || tournamentId == null}
      data-ph-capture-attribute-button="deck-selection-ai-fill"
      className="self-start w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:cursor-not-allowed text-[var(--primary)] [background-color:var(--icon-button-bg)] [border-color:var(--icon-button-border)] [border-width:1px] hover:[background-color:var(--icon-button-hover)] disabled:opacity-40"
      aria-label="Auto-fill deck with AI"
      aria-busy={isPending}
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
