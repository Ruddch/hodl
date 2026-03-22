"use client";

import { useState } from "react";
import type { CardInDeckInfo, DeckDetailResponse, MyDeckEntry, PrizeInfo } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { CardStatsModal } from "@/components/CardStatsModalLazy";
import { ShareDeckModal } from "@/components/ShareDeckModal";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { useTournamentLeaderboard } from "@/lib/api";

export interface DeckProps {
  isRegistered?: boolean;
  onStartClick?: () => void;
  canRegister?: boolean;
  /** Список зарегистрированных колод (новый флоу) */
  myDecks?: MyDeckEntry[] | null;
  /** @deprecated используй myDecks */
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  /** Анрег конкретной деки (новый флоу) */
  onUnregisterDeck?: (deck: MyDeckEntry) => void;
  /** @deprecated используй onUnregisterDeck */
  onUnregister?: () => void;
  isUnregistering?: boolean;
  deckDetail?: DeckDetailResponse | null;
  deckLoading?: boolean;
  wrapInBlurCard?: boolean;
}

// ─── EmptyDeck ────────────────────────────────────────────────────────────────

interface EmptyDeckProps {
  onStartClick: () => void;
  canRegister: boolean;
  tournamentStatus?: "registration" | "ongoing" | "finished";
}

function EmptyDeck({ onStartClick, canRegister, tournamentStatus }: EmptyDeckProps) {
  const isTournamentFinished = tournamentStatus === "finished";
  return (
    <>
      <div className="relative px-8 pt-8">
        <h3 className="text-2xl font-semibold leading-8 text-[var(--text-primary)]">My deck</h3>
      </div>
      <div className="relative flex flex-col items-center py-8 px-8">
        <div className="mb-[-40px]">
          <img src="/deck.png" alt="Deck cards" width={280} height={400} className="object-contain" />
        </div>
        <p className="text-normal md:text-xl font-semibold text-[var(--text-primary)] mb-6">
          {isTournamentFinished ? "You haven't registered any deck" : "You haven't registered any deck yet"}
        </p>
        {!isTournamentFinished && (
          <button
            onClick={onStartClick}
            disabled={!canRegister}
            data-ph-capture-attribute-button="deck-lets-start"
            className={`px-8 py-3 bg-[var(--surface)] rounded-full text-base font-medium flex items-center gap-2 shadow-md transition-colors ${
              canRegister
                ? "text-[var(--primary-muted)] hover:bg-[var(--surface-hover)] cursor-pointer"
                : "text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            Let&apos;s start
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReward(prizes: DeckDetailResponse["prizes"] | undefined): string {
  if (!prizes || prizes.length === 0) return "—";
  const first = prizes[0];
  return `${new Intl.NumberFormat("en-US").format(Number(first.amount))} ${first.reward_name}`;
}

function formatScore(score: number | undefined | null): string {
  if (score === undefined || score === null) return "—";
  return score.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatMcapChange(change: number | null | undefined) {
  if (change === null || change === undefined) return { value: "0%", isPositive: true };
  return { value: `${Math.abs(change).toFixed(2)}%`, isPositive: change > 0 };
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

/** Форматирует массив призов в строку. Суммирует по reward_name. */
function formatPrizes(prizes: PrizeInfo[] | null | undefined): string {
  if (!prizes || prizes.length === 0) return "";
  const totals: Record<string, number> = {};
  for (const p of prizes) {
    totals[p.reward_name] = (totals[p.reward_name] ?? 0) + Number(p.amount);
  }
  return Object.entries(totals)
    .map(([name, amount]) => `${new Intl.NumberFormat("en-US").format(amount)} ${name}`)
    .join(" + ");
}

/** Суммирует призы по всем декам */
function formatTotalPrizes(decks: MyDeckEntry[]): string {
  const totals: Record<string, number> = {};
  for (const deck of decks) {
    for (const p of deck.prizes ?? []) {
      totals[p.reward_name] = (totals[p.reward_name] ?? 0) + Number(p.amount);
    }
  }
  if (Object.keys(totals).length === 0) return "";
  return Object.entries(totals)
    .map(([name, amount]) => `${new Intl.NumberFormat("en-US").format(amount)} ${name}`)
    .join(" + ");
}

// ─── RegisteredDeck (карточная сетка) ─────────────────────────────────────────

interface RegisteredDeckProps {
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  onUnregister?: () => void;
  isUnregistering?: boolean;
  deckDetail?: DeckDetailResponse | null;
  deckLoading?: boolean;
  /** Скрыть place/score/share (используется внутри аккордеона) */
  hideStats?: boolean;
}

function RegisteredDeck({
  myDeck,
  tournamentStatus,
  tournamentId,
  onUnregister,
  isUnregistering,
  deckDetail,
  deckLoading,
  hideStats = false,
}: RegisteredDeckProps) {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{
    imageUrl?: string | null;
    name?: string;
    rarity?: string;
  } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const isViewMode = deckDetail !== undefined || deckLoading;
  const isOngoing = tournamentStatus === "ongoing" || tournamentStatus === "finished";

  const { data: leaderboardData } = useTournamentLeaderboard(
    !isViewMode && isOngoing && tournamentId ? tournamentId : undefined,
    { limit: 10 },
    { refetchInterval: 5 * 60 * 1000 }
  );

  const myPosition = leaderboardData?.my_position;
  const position = isViewMode ? deckDetail?.position : myPosition?.position;
  const finalScore = isViewMode ? deckDetail?.final_score : myPosition?.final_score;
  const prizes = isViewMode ? deckDetail?.prizes : myPosition?.prizes;
  const cards = isViewMode ? (deckDetail?.cards ?? []) : (myDeck ?? []);
  const showCardStats = isViewMode ? true : isOngoing;
  const badgesActive = isViewMode
    ? !!deckDetail
    : isOngoing && (myPosition?.position != null || myPosition?.final_score !== undefined);

  const placeLabel = isViewMode ? "PLACE" : "YOUR PLACE";
  const title = isViewMode ? "Deck" : "My deck";
  const sharePhCapture = isViewMode ? "deck-share-deck-detail" : "deck-share-tournament";

  return (
    <>
      {/* Header */}
      {!hideStats && (
      <div className="flex items-center px-4 sm:px-6 pt-4 pb-4 relative flex-wrap gap-2 sm:gap-4">
        <h3 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)]">{title}</h3>
          <div className="flex gap-1.5 sm:gap-4 ml-0 flex-nowrap">
            <span
              className={`px-1.5 sm:px-2.5 h-6 sm:h-8 flex items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap ${
                badgesActive
                  ? "text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]"
                  : "text-[var(--badge-purple-text)] bg-[var(--badge-purple-muted)]"
              }`}
            >
              {placeLabel}: {position != null ? position : "—"}
            </span>
            <span
              className={`px-1.5 sm:px-2.5 h-6 sm:h-8 flex items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap ${
                badgesActive
                  ? "text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]"
                  : "text-[var(--badge-purple-text)] bg-[var(--badge-purple-muted)]"
              }`}
            >
              DECK SCORE: {formatScore(finalScore)}
            </span>
            {prizes && prizes.length > 0 && (
              <span className="px-1.5 sm:px-2.5 h-6 sm:h-8 flex items-center text-[10px] sm:text-[13px] font-semibold rounded text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)] whitespace-nowrap">
                REWARD: {formatReward(prizes)}
              </span>
            )}
            {!isViewMode && tournamentStatus === "registration" && onUnregister && (
              <button
                onClick={onUnregister}
                disabled={isUnregistering}
                data-ph-capture-attribute-button="deck-delete"
                className="cursor-pointer px-3 py-0 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-[5px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                style={{
                  boxShadow:
                    "0px 4px 8px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)",
                }}
              >
                <TrashIcon className="w-3.5 h-3.5 shrink-0" />
                {isUnregistering ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        {cards.length > 0 && (
          <button
            onClick={() => setShareOpen(true)}
            data-ph-capture-attribute-button={sharePhCapture}
            className="cursor-pointer ml-auto px-3 h-6 sm:h-8 flex items-center gap-1.5 text-[10px] sm:text-[13px] font-semibold rounded text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)] hover:opacity-90 transition-opacity shrink-0"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            SHARE
          </button>
        )}
        {!isOngoing && !isViewMode && (
          <p className={`text-[13px] font-medium text-[var(--text-primary)] ${cards.length > 0 ? "" : "ml-auto"}`}>
            Deck stats appears after the tournament&apos;s start
          </p>
        )}
      </div>
      )}
      {/* Cards section */}
      <div className={`px-4 sm:px-6 pb-6 relative ${hideStats ? "pt-6" : ""}`}>
        {deckLoading ? (
          <div className="grid grid-cols-3 gap-4 py-6 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="min-w-0 rounded-[14px] bg-[var(--surface-muted)] animate-pulse sm:flex-1 sm:max-w-[220px]"
                style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
              />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
            {cards.map(
              (
                card: {
                  user_card_id?: number;
                  card_id?: number;
                  token_name: string;
                  rarity_name?: string;
                  rendered_image_url?: string | null;
                  calculated_score: number;
                  tournament_change?: number | null;
                },
                index: number
              ) => {
                const mcapChange = formatMcapChange(card.tournament_change);
                const cardId = card.card_id;
                return (
                  <div key={card.user_card_id ?? card.card_id ?? index} className="min-w-0 flex flex-col sm:flex-1 sm:max-w-[220px]">
                    <div
                      role="button"
                      tabIndex={0}
                      data-ph-capture-attribute-button="deck-card-view"
                      onClick={() => {
                        if (cardId != null) {
                          setSelectedCardId(cardId);
                          setSelectedCardInfo({
                            imageUrl: card.rendered_image_url,
                            name: card.token_name,
                            rarity: card.rarity_name,
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (cardId != null && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setSelectedCardId(cardId);
                          setSelectedCardInfo({
                            imageUrl: card.rendered_image_url,
                            name: card.token_name,
                            rarity: card.rarity_name,
                          });
                        }
                      }}
                      className="rounded-[7%] overflow-hidden bg-[var(--surface)] mb-2 cursor-pointer hover:ring-2 hover:ring-[var(--primary-muted)]/50 hover:ring-offset-2 transition-shadow"
                      style={{
                        aspectRatio: `${CARD_ASPECT_RATIO}`,
                        boxShadow:
                          "0px 180px 51px 0px rgba(64,65,78,0), 0px 116px 46px 0px rgba(64,65,78,0.01), 0px 65px 39px 0px rgba(64,65,78,0.05), 0px 29px 29px 0px rgba(64,65,78,0.09), 0px 7px 16px 0px rgba(64,65,78,0.1)",
                      }}
                    >
                      {card.rendered_image_url && (
                        <img
                          src={card.rendered_image_url}
                          alt={`${card.token_name} ${card.rarity_name}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {showCardStats && (
                      <div className="mt-0 gap-1 sm:gap-2 sm:mt-2 flex flex-col justify-center">
                        <div className="text-xs sm:text-sm font-normal text-[var(--text-secondary)] leading-4 tracking-normal flex justify-between items-center">
                          <span>Score:</span>
                          <span className="text-[var(--text-primary)]">{formatScore(card.calculated_score)}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-normal leading-[12px] sm:leading-[16px] tracking-normal flex justify-between items-center text-[var(--text-secondary)]">
                          <span>Price change:</span>
                          <span className={`flex items-center gap-1 ${mcapChange.isPositive ? "text-green-600" : "text-red-600"}`}>
                            {mcapChange.isPositive ? (
                              <svg width="8" height="11" viewBox="0 0 8 11" fill="none" className="inline">
                                <path
                                  d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637"
                                  stroke="#1EB461"
                                  strokeWidth="1.01474"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              <svg width="8" height="11" viewBox="0 0 8 11" fill="none" className="inline rotate-180">
                                <path
                                  d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637"
                                  stroke="#EF4444"
                                  strokeWidth="1.01474"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                            {mcapChange.value}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 py-6 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="min-w-0 rounded-[14px] bg-[var(--surface)] sm:flex-1 sm:max-w-[220px]"
                style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCardId != null && (
        <CardStatsModal
          open
          onClose={() => {
            setSelectedCardId(null);
            setSelectedCardInfo(null);
          }}
          cardId={selectedCardId}
          cardImageUrl={selectedCardInfo?.imageUrl}
          cardName={selectedCardInfo?.name}
          cardRarity={selectedCardInfo?.rarity}
        />
      )}

      <ShareDeckModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cards={cards.map((c) => ({
          token_symbol: c.token_symbol ?? c.token_name,
          token_name: c.token_name,
          rendered_image_url: c.rendered_image_url ?? null,
        }))}
      />
    </>
  );
}

// ─── DeckCardPreview (мини-превью карт в свёрнутом аккордеоне) ───────────────

function DeckCardPreview({ cards }: { cards: CardInDeckInfo[] }) {
  return (
    <div className="flex -space-x-2.5">
      {cards.slice(0, 5).map((card, i) => (
        <div
          key={card.user_card_id ?? i}
          className="w-5 h-7 sm:w-6 sm:h-8 rounded-[4px] overflow-hidden border border-white/20 bg-[var(--surface-muted)] shrink-0 shadow-sm"
          style={{ zIndex: 5 - i }}
        >
          {card.rendered_image_url && (
            <img src={card.rendered_image_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── DeckAccordionItem ────────────────────────────────────────────────────────

interface DeckAccordionItemProps {
  deck: MyDeckEntry;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  onUnregister: () => void;
  isUnregistering: boolean;
  defaultOpen: boolean;
}

function DeckAccordionItem({
  deck,
  tournamentStatus,
  tournamentId,
  onUnregister,
  isUnregistering,
  defaultOpen,
}: DeckAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [shareOpen, setShareOpen] = useState(false);

  const cards =
    Array.isArray(deck.cards) && deck.cards.length > 0 && typeof deck.cards[0] === "object"
      ? (deck.cards as CardInDeckInfo[])
      : [];

  const canUnregister = tournamentStatus === "registration";

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-white/5">
      {/* Строка: клик везде переключает раскрытие; Share/Delete — stopPropagation */}
      <div
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-white/[0.06] transition-colors rounded-t-xl"
        onClick={() => setIsOpen((v) => !v)}
      >
        {/* Place — стиль как в лидерборде */}
        <>
          <span
            className="md:hidden shrink-0"
            style={{
              fontFamily: "var(--font-league-gothic), sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1,
              color: "var(--leaderboard-position-color)",
            }}
          >
            {deck.position || 0}
          </span>
          <div
            className="hidden md:flex items-center justify-center shrink-0"
            style={{
              width: "32px",
              minWidth: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--leaderboard-position-border)",
              fontFamily: "var(--font-league-gothic), sans-serif",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "32px",
              color: "var(--leaderboard-position-color)",
              textAlign: "center",
            }}
          >
            {deck.position || 0}
          </div>
        </>

        {cards.length > 0 && <DeckCardPreview cards={cards} />}

        <span className="flex px-1.5 sm:px-2.5 h-6 sm:h-7 items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap text-[var(--badge-purple-text)] bg-[var(--badge-purple-muted)] shrink-0">
          SCORE: {deck.final_score != null ? formatScore(deck.final_score) : "—"}
        </span>

        {deck.prizes && deck.prizes.length > 0 && (
          <span className="flex px-1.5 sm:px-2.5 h-6 sm:h-7 items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)] shrink-0">
            {formatPrizes(deck.prizes)}
          </span>
        )}

        <span className="flex-1 min-w-[4px]" />

        {cards.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
            data-ph-capture-attribute-button="deck-share-tournament"
            className="cursor-pointer px-2 sm:px-3 h-6 sm:h-7 flex items-center gap-1 text-[10px] sm:text-[13px] font-semibold rounded text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)] hover:opacity-90 transition-opacity shrink-0"
          >
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="hidden sm:inline">SHARE</span>
          </button>
        )}

        {canUnregister && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnregister(); }}
            disabled={isUnregistering}
            data-ph-capture-attribute-button="deck-delete"
            className="cursor-pointer px-2 sm:px-3 h-6 sm:h-7 flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-[13px] font-semibold rounded text-white bg-[var(--primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ boxShadow: "0px 2px 6px 0px rgba(74,106,255,0.3)" }}
          >
            <TrashIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{isUnregistering ? "Deleting..." : "Delete"}</span>
            <span className="sr-only sm:hidden">{isUnregistering ? "Deleting deck" : "Delete deck"}</span>
          </button>
        )}

        <span
          className="flex items-center justify-center w-6 h-6 shrink-0 pointer-events-none text-[var(--text-muted)]"
          aria-hidden
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-[var(--border)]">
          <RegisteredDeck
            myDeck={cards}
            tournamentStatus={tournamentStatus}
            tournamentId={tournamentId}
            hideStats
          />
        </div>
      )}

      <ShareDeckModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cards={cards.map((c) => ({
          token_symbol: c.token_symbol ?? c.token_name,
          token_name: c.token_name,
          rendered_image_url: c.rendered_image_url ?? null,
        }))}
      />
    </div>
  );
}

// ─── MyDecksAccordion ─────────────────────────────────────────────────────────

interface MyDecksAccordionProps {
  myDecks: MyDeckEntry[];
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  onUnregisterDeck?: (deck: MyDeckEntry) => void;
  isUnregistering: boolean;
  onAddDeck?: () => void;
  canRegister: boolean;
}

function MyDecksAccordion({
  myDecks,
  tournamentStatus,
  tournamentId,
  onUnregisterDeck,
  isUnregistering,
  onAddDeck,
  canRegister,
}: MyDecksAccordionProps) {
  const canAdd = canRegister && tournamentStatus === "registration";

  const totalRewardsLabel =
    (tournamentStatus === "ongoing" || tournamentStatus === "finished") && formatTotalPrizes(myDecks);

  return (
    <>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
        {/* Row 1: title + count | Add / total rewards прибиты справа */}
        <div className="flex items-center gap-3">
          <h3 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)] shrink-0">
            My decks
          </h3>
          <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] shrink-0">
            {myDecks.length}
          </span>
          <span className="flex-1 min-w-0" />
          <div className="flex items-center gap-2 shrink-0">
            {canAdd && (
              <button
                onClick={onAddDeck}
                data-ph-capture-attribute-button="deck-add-another"
                className="cursor-pointer px-4 sm:px-6 py-1.5 sm:py-2.5 bg-[var(--primary)] hover:opacity-90 text-white text-xs sm:text-sm font-medium rounded-[15px] transition-opacity flex items-center gap-1.5"
                style={{
                  boxShadow:
                    "0px 4px 12px 0px rgba(99, 102, 241, 0.35), 0px 2px 4px 0px rgba(99, 102, 241, 0.2)",
                }}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="max-sm:hidden">Add another deck</span>
                <span className="sm:hidden">Add deck</span>
              </button>
            )}
            {totalRewardsLabel ? (
              <span className="px-2 sm:px-2.5 h-6 sm:h-8 flex items-center text-[11px] sm:text-[13px] font-semibold rounded whitespace-nowrap text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]">
                TOTAL REWARDS: {totalRewardsLabel}
              </span>
            ) : null}
          </div>
        </div>
        {/* Row 2: подпись всегда под заголовком */}
        <p className="mt-1.5 text-[11px] sm:text-[13px] font-medium text-[var(--text-primary)]">
          Deck stats appears after the tournament&apos;s start
        </p>
      </div>

      {/* Accordion list */}
      <div className="px-4 sm:px-6 pb-4 space-y-2">
        {myDecks.map((deck, i) => (
          <DeckAccordionItem
            key={deck.deck_id}
            deck={deck}
            tournamentStatus={tournamentStatus}
            tournamentId={tournamentId}
            onUnregister={() => onUnregisterDeck?.(deck)}
            isUnregistering={isUnregistering}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </>
  );
}

// ─── Deck (публичный компонент) ───────────────────────────────────────────────

export function Deck({
  isRegistered = false,
  onStartClick,
  canRegister = false,
  myDecks,
  myDeck,
  tournamentStatus,
  tournamentId,
  onUnregisterDeck,
  onUnregister,
  isUnregistering = false,
  deckDetail,
  deckLoading,
  wrapInBlurCard = true,
}: DeckProps) {
  const isViewMode = deckDetail !== undefined || deckLoading;
  const hasDecks = myDecks && myDecks.length > 0;

  let content: React.ReactNode;

  if (isViewMode) {
    content = (
      <RegisteredDeck
        deckDetail={deckDetail ?? null}
        deckLoading={deckLoading}
        tournamentStatus={tournamentStatus}
        tournamentId={tournamentId}
      />
    );
  } else if (hasDecks) {
    content = (
      <MyDecksAccordion
        myDecks={myDecks}
        tournamentStatus={tournamentStatus}
        tournamentId={tournamentId}
        onUnregisterDeck={onUnregisterDeck}
        isUnregistering={isUnregistering}
        onAddDeck={onStartClick}
        canRegister={canRegister}
      />
    );
  } else if (isRegistered) {
    // legacy fallback
    content = (
      <RegisteredDeck
        myDeck={myDeck}
        tournamentStatus={tournamentStatus}
        tournamentId={tournamentId}
        onUnregister={onUnregister}
        isUnregistering={isUnregistering}
      />
    );
  } else {
    content = (
      <EmptyDeck
        onStartClick={onStartClick ?? (() => {})}
        canRegister={canRegister}
        tournamentStatus={tournamentStatus}
      />
    );
  }

  if (wrapInBlurCard) {
    return (
      <div data-onboarding="deck">
        <BlurCard blurValue={150} backgroundColor="rgba(141, 121, 253, 0.7)">
          {content}
        </BlurCard>
      </div>
    );
  }
  return <div data-onboarding="deck">{content}</div>;
}
