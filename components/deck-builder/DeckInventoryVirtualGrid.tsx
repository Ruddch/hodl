"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import { useMyProfile } from "@/lib/api";
import type { UserCard, MyDeckEntry } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

const DECK_SIZE = 5;
const ROW_HEIGHT_ESTIMATE = 300;

/** user_card_id из профиля vs card_id (число в API) */
export function collectCardsUsedInOtherDecks(
  myDecks: MyDeckEntry[] | null | undefined,
  profileCards: UserCard[] | undefined,
): { usedUserCardIds: Set<number>; usedCardIds: Set<number> } {
  const knownUserIds = new Set(profileCards?.map((c) => c.user_card_id) ?? []);
  const usedUserCardIds = new Set<number>();
  const usedCardIds = new Set<number>();

  for (const deck of myDecks ?? []) {
    for (const c of deck.cards ?? []) {
      if (typeof c === "number") {
        if (knownUserIds.has(c)) usedUserCardIds.add(c);
        else usedCardIds.add(c);
      } else {
        usedUserCardIds.add(c.user_card_id);
      }
    }
  }
  return { usedUserCardIds, usedCardIds };
}

export function isCardLockedInOtherDeck(
  card: UserCard,
  usedUserCardIds: Set<number>,
  usedCardIds: Set<number>,
): boolean {
  return usedUserCardIds.has(card.user_card_id) || usedCardIds.has(card.card_id);
}

/** Одна ячейка сетки = один экземпляр карты (дубликаты визуально отдельно) */
export type DeckDisplaySlot = {
  slotKey: string;
  mode: "available" | "locked";
  card: UserCard;
};

/** Меньше = выше по «качеству» редкости (показываем раньше): legendary → mythic → epic → rare → common */
const RARITY_RANK: Record<string, number> = {
  legendary: 0,
  mythic: 1,
  epic: 2,
  rare: 3,
  common: 4,
};

export function getDeckInventoryRarityRank(card: UserCard): number {
  const key = card.rarity_name?.trim().toLowerCase() ?? "";
  return RARITY_RANK[key] ?? 99;
}

/**
 * Сортировка слотов (режим «по весу»):
 * 1) вес по убыванию;
 * 2) при равном весе — все варианты одного токена подряд (порядок токенов по символу/имени);
 * 3) внутри одного токена — редкость legendary → … → common;
 * 4) стабильно по id.
 */
function compareSlotsByWeightThenTokenThenRarity(a: DeckDisplaySlot, b: DeckDisplaySlot): number {
  const dw = b.card.token_weight - a.card.token_weight;
  if (dw !== 0) return dw;
  const ds = a.card.token_symbol.localeCompare(b.card.token_symbol, undefined, { sensitivity: "base" });
  if (ds !== 0) return ds;
  const dn = a.card.token_name.localeCompare(b.card.token_name, undefined, { sensitivity: "base" });
  if (dn !== 0) return dn;
  const dr = getDeckInventoryRarityRank(a.card) - getDeckInventoryRarityRank(b.card);
  if (dr !== 0) return dr;
  return a.card.user_card_id - b.card.user_card_id;
}

/** Внутри available / locked — по весу, затем токен, затем редкость (см. compareSlotsByWeightThenTokenThenRarity) */
export function buildDisplaySlots(
  cards: UserCard[],
  isLocked: (c: UserCard) => boolean,
): DeckDisplaySlot[] {
  const available: DeckDisplaySlot[] = [];
  const locked: DeckDisplaySlot[] = [];
  for (const card of cards) {
    const hereLocked = isLocked(card);
    const slot: DeckDisplaySlot = {
      slotKey: `${card.user_card_id}::${hereLocked ? "locked" : "avail"}`,
      mode: hereLocked ? "locked" : "available",
      card,
    };
    if (hereLocked) locked.push(slot);
    else available.push(slot);
  }
  available.sort(compareSlotsByWeightThenTokenThenRarity);
  locked.sort(compareSlotsByWeightThenTokenThenRarity);
  return [...available, ...locked];
}

function buildDisplaySlotsPreserveOrder(
  cards: UserCard[],
  isLocked: (c: UserCard) => boolean,
): DeckDisplaySlot[] {
  const available: DeckDisplaySlot[] = [];
  const locked: DeckDisplaySlot[] = [];
  for (const card of cards) {
    const hereLocked = isLocked(card);
    const slot: DeckDisplaySlot = {
      slotKey: `${card.user_card_id}::${hereLocked ? "locked" : "avail"}`,
      mode: hereLocked ? "locked" : "available",
      card,
    };
    if (hereLocked) locked.push(slot);
    else available.push(slot);
  }
  return [...available, ...locked];
}

function computeCardsPerRow(width: number): number {
  if (width < 480) return 3;
  if (width < 640) return 3;
  if (width < 768) return 4;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 8;
}

function useCardsPerRow() {
  const [cardsPerRow, setCardsPerRow] = useState(() =>
    typeof window === "undefined" ? 6 : computeCardsPerRow(window.innerWidth),
  );
  useEffect(() => {
    const update = () => setCardsPerRow(computeCardsPerRow(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cardsPerRow;
}

export type DeckInventorySortMode = "default" | "rarity" | "name";

/** Редкость: legendary → … → common; внутри одной редкости — вес по убыванию */
function sortCardsByRarityThenWeight(cards: UserCard[]): UserCard[] {
  return [...cards].sort((a, b) => {
    const dr = getDeckInventoryRarityRank(a) - getDeckInventoryRarityRank(b);
    if (dr !== 0) return dr;
    const dw = b.token_weight - a.token_weight;
    if (dw !== 0) return dw;
    return a.user_card_id - b.user_card_id;
  });
}

/** Имя по алфавиту; при одном имени — редкость legendary → common */
function sortCardsByNameThenRarity(cards: UserCard[]): UserCard[] {
  return [...cards].sort((a, b) => {
    const dn = a.token_name.localeCompare(b.token_name);
    if (dn !== 0) return dn;
    const dr = getDeckInventoryRarityRank(a) - getDeckInventoryRarityRank(b);
    if (dr !== 0) return dr;
    return a.user_card_id - b.user_card_id;
  });
}

function sortFilteredCards(cards: UserCard[], sortMode: Exclude<DeckInventorySortMode, "default">): UserCard[] {
  if (sortMode === "rarity") return sortCardsByRarityThenWeight(cards);
  return sortCardsByNameThenRarity(cards);
}

export interface DeckInventoryVirtualGridProps {
  myDecks?: MyDeckEntry[] | null;
  weightLimit: number;
  selectedCards: UserCard[];
  setSelectedCards: React.Dispatch<React.SetStateAction<UserCard[]>>;
  searchQuery: string;
  /** default — как в модалке (сортировка по весу внутри buildDisplaySlots) */
  sortMode?: DeckInventorySortMode;
  /** Доп. классы на scroll-контейнер (например min-h-0 для flex-цепочки) */
  scrollClassName?: string;
  /** Оверлей на ячейку (кнопка compare и т.п.) */
  renderSlotOverlay?: (slot: DeckDisplaySlot) => React.ReactNode;
}

export function DeckInventoryVirtualGrid({
  myDecks,
  weightLimit,
  selectedCards,
  setSelectedCards,
  searchQuery,
  sortMode = "default",
  scrollClassName = "",
  renderSlotOverlay,
}: DeckInventoryVirtualGridProps) {
  const { data: profile, isLoading } = useMyProfile(true);
  const cardsPerRow = useCardsPerRow();
  const parentRef = useRef<HTMLDivElement>(null);

  const { usedUserCardIds, usedCardIds } = useMemo(
    () => collectCardsUsedInOtherDecks(myDecks, profile?.cards),
    [myDecks, profile?.cards],
  );

  const displaySlots = useMemo(() => {
    if (!profile?.cards) return [];

    let cards = profile.cards.filter((card) => !card.is_locked);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (card) =>
          card.token_name.toLowerCase().includes(query) ||
          card.token_symbol.toLowerCase().includes(query),
      );
    }

    const sorted =
      sortMode === "default" ? cards : sortFilteredCards(cards, sortMode);
    const build = sortMode === "default" ? buildDisplaySlots : buildDisplaySlotsPreserveOrder;
    return build(sorted, (c) => isCardLockedInOtherDeck(c, usedUserCardIds, usedCardIds));
  }, [profile?.cards, searchQuery, sortMode, usedUserCardIds, usedCardIds]);

  const currentWeight = useMemo(
    () => selectedCards.reduce((sum, card) => sum + card.token_weight, 0),
    [selectedCards],
  );

  const remainingWeight = weightLimit - currentWeight;

  const rows = useMemo(() => {
    const result: DeckDisplaySlot[][] = [];
    for (let i = 0; i < displaySlots.length; i += cardsPerRow) {
      result.push(displaySlots.slice(i, i + cardsPerRow));
    }
    return result;
  }, [displaySlots, cardsPerRow]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    measureElement,
    overscan: 2,
  });

  const canInteractWithSlot = useCallback(
    (slot: DeckDisplaySlot) => {
      if (slot.mode === "locked") return false;
      const card = slot.card;
      if (selectedCards.some((c) => c.user_card_id === card.user_card_id)) return true;
      if (selectedCards.some((c) => c.token_symbol === card.token_symbol)) return false;
      if (selectedCards.length >= DECK_SIZE) return false;
      if (card.token_weight > remainingWeight) return false;
      return true;
    },
    [selectedCards, remainingWeight],
  );

  const toggleSlot = useCallback(
    (slot: DeckDisplaySlot) => {
      if (slot.mode === "locked") return;
      const card = slot.card;
      setSelectedCards((prev) => {
        const isSelected = prev.some((c) => c.user_card_id === card.user_card_id);
        if (isSelected) return prev.filter((c) => c.user_card_id !== card.user_card_id);
        if (prev.length >= DECK_SIZE) return prev;
        if (prev.some((c) => c.token_symbol === card.token_symbol)) return prev;
        const rw = weightLimit - prev.reduce((s, c) => s + c.token_weight, 0);
        if (card.token_weight > rw) return prev;
        return [...prev, card];
      });
    },
    [weightLimit, setSelectedCards],
  );

  const gridCols = `repeat(${cardsPerRow}, minmax(0, 1fr))`;

  return (
    <div
      ref={parentRef}
      className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 ${scrollClassName}`.trim()}
      style={{ minHeight: "280px" }}
    >
      {isLoading ? (
        <div
          className="grid gap-2 sm:gap-4 w-full max-w-full"
          style={{ gridTemplateColumns: gridCols }}
        >
          {Array.from({ length: Math.min(10, cardsPerRow * 2) }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--surface-elevated)] rounded-xl animate-pulse"
              style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
            />
          ))}
        </div>
      ) : displaySlots.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">
          {searchQuery ? "No cards found" : "You don't have any cards yet"}
        </div>
      ) : (
        <div
          className="w-full max-w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
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
                maxWidth: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingTop: virtualRow.index > 0 ? 16 : 0,
              }}
            >
              <div
                className="grid gap-2 sm:gap-4 w-full min-w-0"
                style={{ gridTemplateColumns: gridCols }}
              >
                {rows[virtualRow.index].map((slot) => {
                  const card = slot.card;
                  const isSelected = selectedCards.some((c) => c.user_card_id === card.user_card_id);
                  const lockedInOtherDeck = slot.mode === "locked";
                  const canInteract = canInteractWithSlot(slot);
                  const duplicateCardType =
                    !isSelected &&
                    !lockedInOtherDeck &&
                    selectedCards.some((c) => c.token_symbol === card.token_symbol);

                  const cell = (
                    <button
                      type="button"
                      onClick={() => canInteract && toggleSlot(slot)}
                      data-ph-capture-attribute-button="deck-selection-card"
                      disabled={!canInteract && !isSelected}
                      title={
                        lockedInOtherDeck
                          ? "Locked in another deck for this tournament"
                          : duplicateCardType
                            ? "This card is already in your pack"
                            : undefined
                      }
                      className={`relative w-full h-full rounded-[10px] sm:rounded-[14px] overflow-visible transition-all ${
                        lockedInOtherDeck
                          ? "opacity-[0.42] grayscale cursor-not-allowed"
                          : isSelected
                            ? "cursor-pointer ring-2 sm:ring-3 ring-[var(--primary)] ring-offset-2 sm:ring-offset-6"
                            : canInteract
                              ? "cursor-pointer"
                              : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute flex items-center justify-center top-0 -translate-y-[14px] sm:-translate-y-[20px] left-1/2 -translate-x-1/2 z-10 px-2 py-1 sm:px-3 sm:py-2 bg-[var(--primary)] rounded-[4px]">
                          <span className="text-[8px] sm:text-[10px] leading-[8px] sm:leading-[10px] font-semibold text-white">
                            SELECTED
                          </span>
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
                            <span className="text-xs text-[var(--text-secondary)]">{card.rarity_name}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );

                  return (
                    <div
                      key={slot.slotKey}
                      className="relative min-w-0"
                      style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                    >
                      {cell}
                      {renderSlotOverlay?.(slot)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
