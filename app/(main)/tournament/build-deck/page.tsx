"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTournamentDetails, useMyProfile } from "@/lib/api";
import {
  useTournamentRegistration,
  type RegistrationErrorContext,
} from "@/lib/hooks/useTournamentRegistration";
import { useAuth } from "@/lib/auth-context";
import { SearchInput } from "@/components/SearchInput";
import { Toast } from "@/components/Toast";
import { CardComparePanel } from "@/components/deck-builder/CardComparePanel";
import { DeckPackFooter } from "@/components/deck-builder/DeckPackFooter";
import { DeckInventoryVirtualGrid, type DeckInventorySortMode } from "@/components/deck-builder/DeckInventoryVirtualGrid";
import type { UserCard } from "@/lib/types";

const DECK_SIZE = 5;

type SortMode = "weight" | "rarity" | "name";

function sortModeToInventory(mode: SortMode): DeckInventorySortMode {
  if (mode === "weight") return "default";
  return mode;
}

function getFriendlyErrorMessage(rawMessage: string, context: RegistrationErrorContext): string {
  const m = rawMessage.toLowerCase();
  if (
    m.includes("reject") ||
    m.includes("denied") ||
    m.includes("deny") ||
    m.includes("cancel") ||
    m.includes("user rejected")
  )
    return "Transaction was cancelled by the user.";
  if (m.includes("кошелек") || m.includes("wallet") || m.includes("mismatch"))
    return "Wallet mismatch. Please switch to the correct wallet.";
  if (context === "register") return "Registration error. Try again later.";
  return "Something went wrong. Try again later.";
}

type MobileTab = "cards" | "stat" | "chart";

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function BuildDeckPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const tournamentId = searchParams.get("tournamentId")
    ? parseInt(searchParams.get("tournamentId")!, 10)
    : undefined;

  const { data: tournamentDetails } = useTournamentDetails(tournamentId, true);
  const { data: profile, isLoading: profileLoading } = useMyProfile(true);

  const tournament = tournamentDetails ?? null;

  const [selectedCards, setSelectedCards] = useState<UserCard[]>([]);
  const [pinnedCards, setPinnedCards] = useState<UserCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("weight");
  const [mobileTab, setMobileTab] = useState<MobileTab>("cards");
  const [toastError, setToastError] = useState({ visible: false, message: "" });

  const { register, isRegistering } = useTournamentRegistration({
    onSuccess: () => {
      router.push(tournamentId ? `/tournament?tournamentId=${tournamentId}` : "/tournament");
    },
    onError: (error, context) => {
      setToastError({ visible: true, message: getFriendlyErrorMessage(error.message, context) });
    },
  });

  const handleBack = () => {
    router.push(tournamentId ? `/tournament?tournamentId=${tournamentId}` : "/tournament");
  };

  const handleRegister = async () => {
    if (!tournament || selectedCards.length !== DECK_SIZE) return;
    const existing = tournamentDetails?.my_decks?.length ?? 0;
    await register(tournament, selectedCards.map((c) => c.user_card_id), {
      deckOrdinal: existing + 1,
    });
  };

  const weightLimit = tournament?.weight_limit ?? 20;

  const currentWeight = useMemo(
    () => selectedCards.reduce((sum, c) => sum + c.token_weight, 0),
    [selectedCards],
  );

  const removeCard = useCallback((userCardId: number) => {
    setSelectedCards((prev) => prev.filter((c) => c.user_card_id !== userCardId));
  }, []);

  const resetSelection = useCallback(() => setSelectedCards([]), []);

  const togglePinCard = useCallback((card: UserCard) => {
    setPinnedCards((prev) => {
      const alreadyPinned = prev.some((c) => c.user_card_id === card.user_card_id);
      if (alreadyPinned) return prev.filter((c) => c.user_card_id !== card.user_card_id);
      return [...prev, card];
    });
  }, []);

  const unpinCard = useCallback((card: UserCard) => {
    setPinnedCards((prev) => prev.filter((c) => c.user_card_id !== card.user_card_id));
  }, []);

  /** Та же логика, что внутри DeckInventoryVirtualGrid — для кнопок в Compare */
  const tryAddCardToDeck = useCallback(
    (card: UserCard) => {
      setSelectedCards((prev) => {
        const isSelected = prev.some((c) => c.user_card_id === card.user_card_id);
        if (isSelected) return prev;
        if (prev.length >= DECK_SIZE) return prev;
        if (prev.some((c) => c.token_symbol === card.token_symbol)) return prev;
        const rw = weightLimit - prev.reduce((s, c) => s + c.token_weight, 0);
        if (card.token_weight > rw) return prev;
        return [...prev, card];
      });
    },
    [weightLimit],
  );

  const deckCardIds = useMemo(
    () => new Set(selectedCards.map((c) => c.user_card_id)),
    [selectedCards],
  );

  const tournamentName = useMemo(() => {
    if (!tournament?.start_date) return "";
    const d = new Date(tournament.start_date);
    const month = d.toLocaleString("en-US", { month: "long" });
    return `${month} fire`;
  }, [tournament?.start_date]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleBack();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  useEffect(() => {
    if (!isAuthenticated) handleBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const inventorySort = sortModeToInventory(sortMode);

  const compareOverlay = useCallback(
    (slot: { mode: "available" | "locked"; card: UserCard }) => {
      if (slot.mode === "locked") return null;
      const card = slot.card;
      const isPinned = pinnedCards.some((c) => c.user_card_id === card.user_card_id);
      return (
        <button
          type="button"
          onClick={() => {
            togglePinCard(card);
          }}
          title={isPinned ? "Remove from compare" : "Compare stats"}
          className={`absolute top-1 right-1 z-[1] w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            isPinned
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--surface)]/80 text-[var(--text-muted)] hover:text-[var(--text-primary)] backdrop-blur-sm"
          }`}
        >
          <ChartIcon className="w-3.5 h-3.5" />
        </button>
      );
    },
    [pinnedCards, togglePinCard],
  );

  /** Та же вертикальная сетка отступов и min-height, что у заголовка Compare — нижний border вровень */
  const desktopFilterRowClass =
    "flex-shrink-0 border-b border-[var(--border)] flex items-center gap-2 sm:gap-3 px-4 pt-3 pb-2 min-h-[63px]";

  const sortToolbar = (compact: boolean) => (
    <div
      className={
        compact
          ? "flex-shrink-0 border-b border-[var(--border)] flex items-center gap-2 sm:gap-3 px-3 pt-2 pb-2"
          : desktopFilterRowClass
      }
    >
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search cards"
        variant="compact"
        showIcon={false}
        className={compact ? "flex-1" : "flex-1 max-w-xs"}
      />
      <div className={`flex gap-1 ${compact ? "flex-shrink-0" : ""}`}>
        {(["weight", "rarity", "name"] as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortMode(s)}
            className={`${compact ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} rounded-lg font-medium capitalize transition-colors ${
              sortMode === s
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  const cardGrid = (
    <DeckInventoryVirtualGrid
      myDecks={tournamentDetails?.my_decks}
      weightLimit={weightLimit}
      selectedCards={selectedCards}
      setSelectedCards={setSelectedCards}
      searchQuery={searchQuery}
      sortMode={inventorySort}
      scrollClassName="pb-30 sm:pb-30"
      renderSlotOverlay={compareOverlay}
    />
  );

  return (
    <div className="fixed inset-0 z-30 bg-[var(--background)] flex flex-col min-h-0 md:z-[55]">
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
          aria-label="Back to tournament"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
            Build deck{tournamentName ? ` — ${tournamentName} tournament` : ""}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">Select {DECK_SIZE} cards for your deck</p>
        </div>
      </div>

      <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          {sortToolbar(false)}
          {cardGrid}
        </div>
        <div className="w-px bg-[var(--border)] flex-shrink-0" />
        <div className="flex-shrink-0 w-[440px] xl:w-[520px] flex flex-col min-h-0 border-l border-[var(--border)]">
          <div className={desktopFilterRowClass}>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Compare
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <CardComparePanel
              pinnedCards={pinnedCards}
              deckCardIds={deckCardIds}
              weightLimit={weightLimit}
              currentWeight={currentWeight}
              onAddToDeck={tryAddCardToDeck}
              onRemoveFromDeck={(card) => removeCard(card.user_card_id)}
              onUnpin={unpinCard}
            />
          </div>
        </div>
      </div>

      <div className="flex md:hidden flex-col flex-1 min-h-0 overflow-hidden">
        {/* Видимый переключатель режима над поиском/фильтрами (раньше только внизу экрана) */}
        <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 pt-4 pb-2">
          <div className="flex w-full gap-1 p-[2px] rounded-[10px] bg-[var(--input-bg)]">
            {(
              [
                { tab: "cards" as const, label: "My cards" },
                {
                  tab: "stat" as const,
                  label: pinnedCards.length ? `Stat (${pinnedCards.length})` : "Stat",
                },
                { tab: "chart" as const, label: "Chart" },
              ] as const
            ).map(({ tab, label }) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMobileTab(tab)}
                className={`flex-1 min-w-0 py-2 rounded-[8px] text-[10px] sm:text-[11px] font-medium transition-colors truncate px-0.5 sm:px-1 ${
                  mobileTab === tab
                    ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {mobileTab === "cards" && (
            <>
              {sortToolbar(true)}
              {cardGrid}
            </>
          )}
          {mobileTab === "stat" && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CardComparePanel
                mobileSection="stats"
                pinnedCards={pinnedCards}
                deckCardIds={deckCardIds}
                weightLimit={weightLimit}
                currentWeight={currentWeight}
                onAddToDeck={tryAddCardToDeck}
                onRemoveFromDeck={(card) => removeCard(card.user_card_id)}
                onUnpin={unpinCard}
              />
            </div>
          )}
          {mobileTab === "chart" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardComparePanel
                mobileSection="chart"
                pinnedCards={pinnedCards}
                deckCardIds={deckCardIds}
                weightLimit={weightLimit}
                currentWeight={currentWeight}
                onAddToDeck={tryAddCardToDeck}
                onRemoveFromDeck={(card) => removeCard(card.user_card_id)}
                onUnpin={unpinCard}
              />
            </div>
          )}
        </div>
      </div>

      <DeckPackFooter
        selectedCards={selectedCards}
        onRemoveCard={removeCard}
        onResetSelection={resetSelection}
        allUserCards={profile?.cards ?? []}
        tournamentId={tournamentId}
        onSuggestError={(message) => setToastError({ visible: true, message })}
        weightLimit={weightLimit}
        onFillDeck={setSelectedCards}
        aiFillDisabled={profileLoading}
        onSecondaryClick={handleBack}
        secondaryButtonLabel="Cancel"
        secondaryDisabled={isRegistering}
        onRegister={() => {
          void handleRegister();
        }}
        isRegistering={isRegistering}
      />

      <Toast
        visible={toastError.visible}
        onDismiss={() => setToastError((p) => ({ ...p, visible: false }))}
        variant="error"
        message={toastError.message}
      />
    </div>
  );
}

export default function BuildDeckPage() {
  return (
    <Suspense fallback={null}>
      <BuildDeckPageContent />
    </Suspense>
  );
}
