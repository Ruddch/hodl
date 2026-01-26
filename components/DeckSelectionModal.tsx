"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMyProfile } from "@/lib/api";
import type { UserCard, Tournament } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

interface DeckSelectionModalProps {
  tournament: Tournament;
  onClose: () => void;
  onRegister: (selectedCardIds: number[]) => void;
  isRegistering?: boolean;
}

const DECK_SIZE = 5;
const CARDS_PER_ROW = 6;

export function DeckSelectionModal({
  tournament,
  onClose,
  onRegister,
  isRegistering = false,
}: DeckSelectionModalProps) {
  const { data: profile, isLoading } = useMyProfile(true);
  const [selectedCards, setSelectedCards] = useState<UserCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const parentRef = useRef<HTMLDivElement>(null);

  // Фильтруем карты по поиску
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

    // Сортируем по token_weight (по убыванию - сначала более тяжелые карты)
    return cards.sort((a, b) => b.token_weight - a.token_weight);
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
    for (let i = 0; i < filteredCards.length; i += CARDS_PER_ROW) {
      result.push(filteredCards.slice(i, i + CARDS_PER_ROW));
    }
    return result;
  }, [filteredCards]);

  // Виртуализация - высота ряда зависит от ширины карты и aspect ratio
  // При 6 колонках с gap-4 (16px) примерная ширина карты ~180px, высота ~282px
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => {
      // Первая строка без padding-top, остальные с padding-top 24px для gap
      return index === 0 ? 300 : 324;
    },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[1280px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-black">
                Register pack for the {tournamentName} tournament
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Select {DECK_SIZE} cards you want to bet this week
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search by card name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cards Grid with Virtualization */}
        <div
          ref={parentRef}
          className="flex-1 overflow-auto p-6 pb-24"
          style={{ minHeight: "320px" }}
        >
          {isLoading ? (
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-200 rounded-xl animate-pulse"
                  style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                />
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-zinc-500">
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
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingTop: virtualRow.index > 0 ? '24px' : '0',
                  }}
                >
                  <div className="grid grid-cols-6 gap-4">
                    {rows[virtualRow.index].map((card) => {
                      const isSelected = selectedCards.some(
                        (c) => c.user_card_id === card.user_card_id
                      );
                      const canSelect = isCardSelectable(card);

                      return (
                        <button
                          key={card.user_card_id}
                          onClick={() => canSelect && toggleCard(card)}
                          disabled={!canSelect && !isSelected}
                          className={`relative rounded-[14px] overflow-visible transition-all ${
                            isSelected
                              ? "ring-3 ring-[#2200EF] ring-offset-6"
                              : canSelect
                              ? ""
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                        >
                          {/* SELECTED label */}
                          {isSelected && (
                            <div className="absolute flex items-center justify-center top-0 -translate-y-[20px] left-1/2 -translate-x-1/2 z-10 px-3 py-2 bg-[#2200EF] rounded-[4px]">
                              <span className="text-[10px] leading-[10px] font-semibold text-white">SELECTED</span>
                            </div>
                          )}
                          <div className="w-full h-full rounded-[14px] overflow-hidden">
                            {card.rendered_image_url ? (
                              <img
                                src={card.rendered_image_url}
                                alt={card.token_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 flex flex-col items-center justify-center p-2">
                                <span className="text-sm font-bold text-zinc-600">
                                  {card.token_symbol}
                                </span>
                                <span className="text-xs text-zinc-500">
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
        <div className="relative">
          {/* Selected Cards - выступают наполовину над футером */}
          <div className="absolute left-6 bottom-full mb-[-90px] flex items-end gap-3 z-10">
            {Array.from({ length: DECK_SIZE }).map((_, index) => {
              const card = selectedCards[index];
              return (
                <div
                  key={index}
                  className="relative w-[120px] rounded-xl transition-all"
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
                        <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                          <span className="text-xs text-zinc-500">{card.token_symbol}</span>
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={() => removeCard(card.user_card_id)}
                        className="absolute cursor-pointer -top-1.5 -right-1.5 w-5 h-5 bg-white border border-[#EBEBEB] rounded-lg flex items-center justify-center hover:bg-zinc-100 transition-colors backdrop-blur-[150px]"
                        style={{
                          boxShadow: '0px 1px 3px 0px rgba(79, 79, 79, 0.1)'
                        }}
                      >
                        <svg 
                          width="13" 
                          height="13" 
                          viewBox="0 0 13 13" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M9.32044 3.10693L3.10681 9.32057M3.10681 3.10693L9.32044 9.32057" 
                            stroke="#2200EF" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    /* Empty slot with blur background */
                    <div className="w-full h-full rounded-xl border-2 border-dashed border-zinc-300 bg-[#D8D4FF]/29 backdrop-blur-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer content */}
          <div className="bg-white border-t border-zinc-100 px-8 py-5">
            <div className="flex items-end justify-end gap-6">
              {/* Weight Info and Actions */}
              <div className="flex flex-col items-end gap-4">
                {/* Weight info with progress bar */}
                <div className="w-[470px]">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[16px] font-semibold text-black">Weight of the pack</span>
                    <span className="text-sm font-bold text-black">
                      {currentWeight}/{tournament.weight_limit}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((currentWeight / tournament.weight_limit) * 100, 100)}%`,
                        backgroundColor: '#2200EF'
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedCards.length} cards selected
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={onClose}
                    disabled={isRegistering}
                    className="flex-1 py-3 bg-white rounded-2xl text-base font-medium text-[#2200EF] leading-none tracking-normal text-center transition-colors disabled:opacity-50"
                    style={{ 
                      border: '1px solid rgba(34, 0, 239, 0.08)',
                      boxShadow: '0px 0px 1px 0px rgba(133, 109, 253, 0.1), 0px 1px 1px 0px rgba(133, 109, 253, 0.09)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={selectedCards.length !== DECK_SIZE || isRegistering}
                    className="flex-1 py-3 rounded-2xl border border-[#2200EF] disabled:border-zinc-300  disabled:bg-zinc-300  disabled:cursor-not-allowed leading-none text-white font-medium transition-colors hover:opacity-90"
                    style={{ 
                      backgroundColor: selectedCards.length === DECK_SIZE && !isRegistering ? '#2200EF' : undefined
                    }}
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
