"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { UserCard, Tournament, MyDeckEntry } from "@/lib/types";
import { getTournamentDisplayName } from "@/lib/utils/tournaments";
import { SearchInput } from "@/components/SearchInput";
import { DeckInventoryVirtualGrid } from "@/components/deck-builder/DeckInventoryVirtualGrid";
import { DeckPackFooter } from "@/components/deck-builder/DeckPackFooter";
import { useMyProfile } from "@/lib/api";
import { Toast } from "@/components/Toast";

interface DeckSelectionModalProps {
  tournament: Tournament;
  /** Уже зарегистрированные колоды — карты из них внизу списка, бледные и недоступны */
  myDecks?: MyDeckEntry[] | null;
  onClose: () => void;
  onRegister: (selectedCardIds: number[]) => void;
  isRegistering?: boolean;
}

const DECK_SIZE = 5;

export function DeckSelectionModal({
  tournament,
  myDecks,
  onClose,
  onRegister,
  isRegistering = false,
}: DeckSelectionModalProps) {
  const { data: profile, isLoading } = useMyProfile(true);
  const [selectedCards, setSelectedCards] = useState<UserCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastError, setToastError] = useState({ visible: false, message: "" });

  // Удаление карты из выбранных
  const removeCard = useCallback((userCardId: number) => {
    setSelectedCards((prev) => prev.filter((c) => c.user_card_id !== userCardId));
  }, []);

  // Сброс всех выбранных карт
  const resetSelection = useCallback(() => {
    setSelectedCards([]);
  }, []);

  const tournamentName = useMemo(
    () => getTournamentDisplayName(tournament.id, tournament.start_date),
    [tournament.id, tournament.start_date],
  );

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
      <div className="relative w-full h-full min-h-0 sm:h-auto sm:max-h-[90vh] sm:max-w-[1280px] bg-[var(--surface)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:mx-4">
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
              dataPhCaptureAttributeButton="search-deck-selection"
            />
          </div>
        </div>

        <DeckInventoryVirtualGrid
          myDecks={myDecks}
          weightLimit={tournament.weight_limit}
          selectedCards={selectedCards}
          setSelectedCards={setSelectedCards}
          searchQuery={searchQuery}
          sortMode="default"
          scrollClassName="pb-30 sm:pb-30"
        />

        <DeckPackFooter
          selectedCards={selectedCards}
          onRemoveCard={removeCard}
          onResetSelection={resetSelection}
          allUserCards={profile?.cards ?? []}
          tournamentId={tournament.id}
          onSuggestError={(message) => setToastError({ visible: true, message })}
          weightLimit={tournament.weight_limit}
          onFillDeck={setSelectedCards}
          aiFillDisabled={isLoading}
          onSecondaryClick={onClose}
          secondaryButtonLabel="Cancel"
          secondaryDisabled={isRegistering}
          onRegister={handleRegister}
          isRegistering={isRegistering}
        />
      </div>
      <Toast
        visible={toastError.visible}
        onDismiss={() => setToastError((p) => ({ ...p, visible: false }))}
        variant="error"
        message={toastError.message}
      />
    </div>
  );
}
