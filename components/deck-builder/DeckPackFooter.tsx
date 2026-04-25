"use client";

import { useMemo, useId } from "react";
import { AiDeckFillButton } from "@/components/AiDeckFillButton";
import type { UserCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

const DECK_SIZE = 5;

export interface DeckPackFooterProps {
  selectedCards: UserCard[];
  onRemoveCard: (userCardId: number) => void;
  onResetSelection: () => void;
  availableCards: UserCard[];
  weightLimit: number;
  onFillDeck: (cards: UserCard[]) => void;
  /** Для AiDeckFillButton */
  aiFillDisabled?: boolean;
  onSecondaryClick: () => void;
  secondaryButtonLabel: string;
  secondaryDisabled?: boolean;
  onRegister: () => void;
  isRegistering?: boolean;
}

/**
 * Нижняя панель выбранной колоды + вес + Cancel/Register — та же верстка, что в DeckSelectionModal.
 */
export function DeckPackFooter({
  selectedCards,
  onRemoveCard,
  onResetSelection,
  availableCards,
  weightLimit,
  onFillDeck,
  aiFillDisabled = false,
  onSecondaryClick,
  secondaryButtonLabel,
  secondaryDisabled = false,
  onRegister,
  isRegistering = false,
}: DeckPackFooterProps) {
  const resetIconClipId = useId();

  const currentWeight = useMemo(
    () => selectedCards.reduce((sum, card) => sum + card.token_weight, 0),
    [selectedCards],
  );

  return (
    <div className="relative flex-shrink-0">
      {/* Selected Cards - выступают наполовину над футером */}
      {/* pointer-events-none: полоса визуально заходит на футер (отриц. margin), иначе перехватывает клики по Cancel/Register */}
      <div className="absolute left-3 right-3 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] sm:left-6 sm:right-auto bottom-full mb-[-15px] sm:mb-[-20px] md:mb-[-20px] lg:mb-[-140px] flex items-end justify-center sm:justify-start gap-[5px] md:gap-[13px] z-10 pb-1 pointer-events-none">
        {Array.from({ length: DECK_SIZE }).map((_, index) => {
          const card = selectedCards[index];
          return (
            <div
              key={index}
              className="relative w-[calc(18%-4px)] md:w-[120px] flex-shrink-0 rounded-lg sm:rounded-xl transition-all pointer-events-auto"
              style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
            >
              {card ? (
                <>
                  {card.rendered_image_url ? (
                    <img
                      src={card.rendered_image_url}
                      alt={card.token_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--surface-elevated)] flex items-center justify-center">
                      <span className="text-xs text-[var(--text-muted)]">{card.token_symbol}</span>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => onRemoveCard(card.user_card_id)}
                    className="absolute cursor-pointer -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-7 h-7 sm:w-5 sm:h-5 bg-[var(--surface)] border border-[var(--border)] rounded-md sm:rounded-lg flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors backdrop-blur-[150px]"
                    data-ph-capture-attribute-button="deck-selection-remove-card"
                    style={{
                      boxShadow: "0px 1px 3px 0px rgba(79, 79, 79, 0.1)",
                    }}
                    aria-label="Remove card"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="sm:w-[13px] sm:h-[13px]"
                    >
                      <path
                        d="M9.32044 3.10693L3.10681 9.32057M3.10681 3.10693L9.32044 9.32057"
                        stroke="var(--primary)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                /* Empty slot with blur background */
                <div className="w-full h-full rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--badge-purple-muted)] backdrop-blur-xl flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
        {/* Кнопка сброса всех выбранных карт */}
        <button
          type="button"
          onClick={onResetSelection}
          disabled={selectedCards.length === 0}
          data-ph-capture-attribute-button="deck-selection-reset"
          className="self-start -ml-0 md:-ml-2 w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:cursor-not-allowed text-[var(--primary)] [background-color:var(--icon-button-bg)] [border-color:var(--icon-button-border)] [border-width:1px] hover:[background-color:var(--icon-button-hover)] disabled:hover:[background-color:var(--icon-button-bg)] pointer-events-auto"
          aria-label="Reset all selected cards"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath={`url(#${resetIconClipId})`}>
              <path
                d="M9.15355 10.6182H12.815M12.815 10.6182V6.95676M12.815 10.6182L8.97047 6.77369C8.43639 6.2396 7.71201 5.93955 6.95669 5.93955C6.20138 5.93955 5.477 6.2396 4.94291 6.77369C4.67846 7.03814 4.46869 7.35209 4.32556 7.69762C4.18244 8.04314 4.10878 8.41347 4.10878 8.78747C4.10878 9.54278 4.40883 10.2672 4.94291 10.8012L6.22441 12.0827"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <clipPath id={resetIconClipId}>
                <rect width="12.4273" height="12.4273" fill="white" transform="translate(8.7874) rotate(45)" />
              </clipPath>
            </defs>
          </svg>
        </button>
        {/* Кнопка AI-автозаполнения колоды (ff: ff_ai_deck_fill) */}
        <span className="pointer-events-auto self-start">
          <AiDeckFillButton
            availableCards={availableCards}
            weightLimit={weightLimit}
            onFill={onFillDeck}
            disabled={aiFillDisabled}
          />
        </span>
      </div>

      <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 sm:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end gap-4 sm:gap-6">
          {/* Weight Info and Actions */}
          <div className="flex flex-col w-full sm:items-end sm:max-w-[470px] gap-3 sm:gap-4">
            {/* Weight info with progress bar */}
            <div className="w-full">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm sm:text-[16px] font-semibold text-[var(--text-primary)]">Weight of the pack</span>
                <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                  {currentWeight}/{weightLimit}
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((currentWeight / weightLimit) * 100, 100)}%`,
                    backgroundColor: "var(--primary)",
                  }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{selectedCards.length} cards selected</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:flex-row">
              <button
                type="button"
                onClick={onSecondaryClick}
                disabled={secondaryDisabled}
                className="flex-1 py-2.5 sm:py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-[var(--primary)] leading-none tracking-normal text-center transition-colors disabled:opacity-50"
                data-ph-capture-attribute-button="deck-selection-cancel"
              >
                {secondaryButtonLabel}
              </button>
              <button
                type="button"
                onClick={onRegister}
                disabled={selectedCards.length !== DECK_SIZE || isRegistering}
                data-ph-capture-attribute-button="deck-selection-register"
                className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-sm sm:text-base leading-none font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed ${
                  selectedCards.length === DECK_SIZE && !isRegistering
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-muted)] disabled:border-[var(--border)] disabled:bg-[var(--surface-elevated)]"
                }`}
              >
                {isRegistering ? "Registering..." : "Register"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
