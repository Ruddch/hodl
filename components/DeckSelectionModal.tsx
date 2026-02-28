"use client";

import { useState, useMemo, useCallback, useRef, useEffect, useId } from "react";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import { useMyProfile } from "@/lib/api";
import type { UserCard, Tournament } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { SearchInput } from "@/components/SearchInput";

interface DeckSelectionModalProps {
  tournament: Tournament;
  onClose: () => void;
  onRegister: (selectedCardIds: number[]) => void;
  isRegistering?: boolean;
}

const DECK_SIZE = 5;
const ROW_HEIGHT_ESTIMATE = 300; // грубая оценка, measureElement скорректирует

function getCardIdentityKey(card: UserCard) {
  return `${card.token_symbol}|${card.token_name}|${card.token_weight}|${card.rarity_name}|${card.design_type} ?? ""}`;
}

// Хук для определения количества колонок по ширине экрана
function useCardsPerRow() {
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    if (typeof window === "undefined") return 6;
    const w = window.innerWidth;
    if (w < 480) return 3;
    if (w < 640) return 3;
    if (w < 768) return 4;
    if (w < 1024) return 5;
    return 6;
  });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setCardsPerRow(3);
      else if (w < 640) setCardsPerRow(3);
      else if (w < 768) setCardsPerRow(4);
      else if (w < 1024) setCardsPerRow(5);
      else setCardsPerRow(6);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cardsPerRow;
}

export function DeckSelectionModal({
  tournament,
  onClose,
  onRegister,
  isRegistering = false,
}: DeckSelectionModalProps) {
  const { data: profile, isLoading } = useMyProfile(true);
  const [selectedCards, setSelectedCards] = useState<UserCard[]>([]);
  const resetIconClipId = useId();
  const [searchQuery, setSearchQuery] = useState("");
  const cardsPerRow = useCardsPerRow();
  const parentRef = useRef<HTMLDivElement>(null);

  // Фильтруем карты по поиску, показываем только уникальные по параметрам
  const filteredCards = useMemo(() => {
    if (!profile?.cards) return [];

    let cards = profile.cards.filter((card) => !card.is_locked);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.token_name.toLowerCase().includes(query) ||
          card.token_symbol.toLowerCase().includes(query)
      );
    }

    cards = cards.sort((a, b) => b.token_weight - a.token_weight);

    // Уникальность по identity (token, rarity, design и т.д.) — оставляем первый из группы
    const seen = new Set<string>();
    return cards.filter((card) => {
      const key = getCardIdentityKey(card);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profile?.cards, searchQuery]);

  // Текущий вес выбранных карт
  const currentWeight = useMemo(() => {
    return selectedCards.reduce((sum, card) => sum + card.token_weight, 0);
  }, [selectedCards]);

  // Оставшийся допустимый вес
  const remainingWeight = tournament.weight_limit - currentWeight;

  // Группируем карты по рядам для виртуализации
  const rows = useMemo(() => {
    const result: UserCard[][] = [];
    for (let i = 0; i < filteredCards.length; i += cardsPerRow) {
      result.push(filteredCards.slice(i, i + cardsPerRow));
    }
    return result;
  }, [filteredCards, cardsPerRow]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    measureElement,
    overscan: 2,
  });

  // Проверка доступности карты
  const isCardSelectable = useCallback(
    (card: UserCard) => {
      if (selectedCards.some((c) => c.user_card_id === card.user_card_id)) {
        return true;
      }
      if (selectedCards.length >= DECK_SIZE) {
        return false;
      }
      if (card.token_weight > remainingWeight) {
        return false;
      }
      return true;
    },
    [selectedCards, remainingWeight]
  );

  // Выбор/снятие выбора карты
  const toggleCard = useCallback(
    (card: UserCard) => {
      setSelectedCards((prev) => {
        const isSelected = prev.some((c) => c.user_card_id === card.user_card_id);
        if (isSelected) {
          return prev.filter((c) => c.user_card_id !== card.user_card_id);
        }
        if (prev.length >= DECK_SIZE) return prev;
        if (card.token_weight > remainingWeight) return prev;
        return [...prev, card];
      });
    },
    [remainingWeight]
  );

  // Удаление карты из выбранных
  const removeCard = useCallback((userCardId: number) => {
    setSelectedCards((prev) => prev.filter((c) => c.user_card_id !== userCardId));
  }, []);

  // Сброс всех выбранных карт
  const resetSelection = useCallback(() => {
    setSelectedCards([]);
  }, []);

  // Название турнира
  const tournamentName = useMemo(() => {
    const date = new Date(tournament.start_date);
    const month = date.toLocaleString("en-US", { month: "long" });
    return `${month} fire`;
  }, [tournament.start_date]);

  // Регистрация
  const handleRegister = () => {
    if (selectedCards.length !== DECK_SIZE) return;
    onRegister(selectedCards.map((c) => c.user_card_id));
  };

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      />

      {/* Modal - full screen на мобилке, центрированная на десктопе */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[1280px] bg-[var(--surface)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:mx-4">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-[var(--text-primary)] leading-tight">
                Register pack for the {tournamentName} tournament
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Select {DECK_SIZE} cards you want to bet this week
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              aria-label="Close"
              data-ph-capture-attribute-button="deck-selection-modal-close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 sm:mt-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by card name"
              variant="compact"
              showIcon={false}
              className="w-full sm:max-w-sm"
            />
          </div>
        </div>

        {/* Cards Grid with Virtualization */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto p-3 sm:p-6 pb-30 sm:pb-30"
          style={{ minHeight: "280px" }}
        >
          {isLoading ? (
            <div
              className="grid gap-2 sm:gap-4"
              style={{ gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)` }}
            >
              {Array.from({ length: Math.min(10, cardsPerRow * 2) }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] rounded-xl animate-pulse"
                  style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                />
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">
              {searchQuery ? "No cards found" : "You don't have any cards yet"}
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingTop: virtualRow.index > 0 ? 16 : 0,
                  }}
                >
                  <div
                    className="grid gap-2 sm:gap-4"
                    style={{ gridTemplateColumns: `repeat(${cardsPerRow}, 1fr)` }}
                  >
                    {rows[virtualRow.index].map((card) => {
                      const isSelected = selectedCards.some(
                        (c) => c.user_card_id === card.user_card_id
                      );
                      const canSelect = isCardSelectable(card);

                      return (
                        <button
                          key={card.user_card_id}
                          onClick={() => canSelect && toggleCard(card)}
                          data-ph-capture-attribute-button="deck-selection-card"
                          disabled={!canSelect && !isSelected}
                          className={`relative cursor-pointer rounded-[10px] sm:rounded-[14px] overflow-visible transition-all ${
                            isSelected
                              ? "ring-2 sm:ring-3 ring-[var(--primary)] ring-offset-2 sm:ring-offset-6"
                              : canSelect
                              ? ""
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                        >
                          {/* SELECTED label */}
                          {isSelected && (
                            <div className="absolute flex items-center justify-center top-0 -translate-y-[14px] sm:-translate-y-[20px] left-1/2 -translate-x-1/2 z-10 px-2 py-1 sm:px-3 sm:py-2 bg-[var(--primary)] rounded-[4px]">
                              <span className="text-[8px] sm:text-[10px] leading-[8px] sm:leading-[10px] font-semibold text-white">SELECTED</span>
                            </div>
                          )}
                          <div className="w-full h-full rounded-[10px] sm:rounded-[14px] overflow-hidden">
                            {card.rendered_image_url ? (
                              <img
                                src={card.rendered_image_url}
                                alt={card.token_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-hover)] flex flex-col items-center justify-center p-2">
                                <span className="text-sm font-bold text-[var(--text-muted)]">
                                  {card.token_symbol}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {card.rarity_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Selected Cards and Actions */}
        <div className="relative flex-shrink-0">
          {/* Selected Cards - выступают наполовину над футером */}
          <div className="absolute left-3 right-3 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] sm:left-6 sm:right-auto bottom-full mb-[-15px] sm:mb-[-20px] md:mb-[-20px] lg:mb-[-90px] flex items-end justify-center sm:justify-start gap-[5px] md:gap-[13px] z-10 pb-1">
            {Array.from({ length: DECK_SIZE }).map((_, index) => {
              const card = selectedCards[index];
              return (
                <div
                  key={index}
                  className="relative w-[calc(18%-4px)] md:w-[120px] flex-shrink-0 rounded-lg sm:rounded-xl transition-all"
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
                        onClick={() => removeCard(card.user_card_id)}
                        className="absolute cursor-pointer -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-7 h-7 sm:w-5 sm:h-5 bg-[var(--surface)] border border-[var(--border)] rounded-md sm:rounded-lg flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors backdrop-blur-[150px]"
                        data-ph-capture-attribute-button="deck-selection-remove-card"
                        style={{
                          boxShadow: '0px 1px 3px 0px rgba(79, 79, 79, 0.1)'
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
              onClick={resetSelection}
              disabled={selectedCards.length === 0}
              data-ph-capture-attribute-button="deck-selection-reset"
              className="self-start -ml-0 md:-ml-2 w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors disabled:cursor-not-allowed text-[var(--primary)] [background-color:var(--icon-button-bg)] [border-color:var(--icon-button-border)] [border-width:1px] hover:[background-color:var(--icon-button-hover)] disabled:hover:[background-color:var(--icon-button-bg)]"
              aria-label="Reset all selected cards"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath={`url(#${resetIconClipId})`}>
                  <path d="M9.15355 10.6182H12.815M12.815 10.6182V6.95676M12.815 10.6182L8.97047 6.77369C8.43639 6.2396 7.71201 5.93955 6.95669 5.93955C6.20138 5.93955 5.477 6.2396 4.94291 6.77369C4.67846 7.03814 4.46869 7.35209 4.32556 7.69762C4.18244 8.04314 4.10878 8.41347 4.10878 8.78747C4.10878 9.54278 4.40883 10.2672 4.94291 10.8012L6.22441 12.0827" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id={resetIconClipId}>
                    <rect width="12.4273" height="12.4273" fill="white" transform="translate(8.7874) rotate(45)"/>
                  </clipPath>
                </defs>
              </svg>
            </button>
          </div>

          {/* Footer content */}
          <div className="bg-[var(--surface)] border-t border-[var(--border)] px-4 sm:px-8 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end gap-4 sm:gap-6">
              {/* Weight Info and Actions */}
              <div className="flex flex-col w-full sm:items-end sm:max-w-[470px] gap-3 sm:gap-4">
                {/* Weight info with progress bar */}
                <div className="w-full">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm sm:text-[16px] font-semibold text-[var(--text-primary)]">Weight of the pack</span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                      {currentWeight}/{tournament.weight_limit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((currentWeight / tournament.weight_limit) * 100, 100)}%`,
                        backgroundColor: 'var(--primary)'
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {selectedCards.length} cards selected
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:flex-row">
                  <button
                    onClick={onClose}
                    disabled={isRegistering}
                    className="flex-1 py-2.5 sm:py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium text-[var(--primary)] leading-none tracking-normal text-center transition-colors disabled:opacity-50"
                    data-ph-capture-attribute-button="deck-selection-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
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
      </div>
    </div>
  );
}
