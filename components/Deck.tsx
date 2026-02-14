"use client";

import { useState } from "react";
import type { CardInDeckInfo, DeckDetailResponse } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { CardStatsModal } from "@/components/CardStatsModal";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { useTournamentLeaderboard } from "@/lib/api";

export interface DeckProps {
  /** Режим "моя колода" на странице турнира */
  isRegistered?: boolean;
  onStartClick?: () => void;
  canRegister?: boolean;
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  onUnregister?: () => void;
  isUnregistering?: boolean;
  /** Режим просмотра чужой колоды (из лидерборда): данные колоды */
  deckDetail?: DeckDetailResponse | null;
  deckLoading?: boolean;
  /** Обернуть в BlurCard (false для вставки в модалку) */
  wrapInBlurCard?: boolean;
}

interface EmptyDeckProps {
  onStartClick: () => void;
  canRegister: boolean;
}

function EmptyDeck({ onStartClick, canRegister }: EmptyDeckProps) {
  return (
    <>
      {/* Header */}
      <div className="relative px-8 pt-8">
        <h3 className="text-2xl font-semibold leading-8 text-[var(--text-primary)]">My deck</h3>
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center py-8 px-8">
        {/* Изображение карт */}
        <div className="mb-[-40px]">
          <img 
            src="/deck.png" 
            alt="Deck cards" 
            width={280} 
            height={400}
            className="object-contain"
          />
        </div>

        <p className="text-normal md:text-xl font-semibold text-[var(--text-primary)] mb-6 ">
          You haven&apos;t registered any deck yet
        </p>

        <button
          onClick={onStartClick}
          disabled={!canRegister}
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
      </div>
    </>
  );
}

interface RegisteredDeckProps {
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
  onUnregister?: () => void;
  isUnregistering?: boolean;
  /** Режим просмотра: данные колоды из API (лидерборд) */
  deckDetail?: DeckDetailResponse | null;
  deckLoading?: boolean;
}

function formatReward(prizes: DeckDetailResponse["prizes"] | undefined): string {
  if (!prizes || prizes.length === 0) return "—";
  const first = prizes[0];
  const amount = Number(first.amount);
  return `${new Intl.NumberFormat("en-US").format(amount)} ${first.reward_name}`;
}

function RegisteredDeck({ myDeck, tournamentStatus, tournamentId, onUnregister, isUnregistering, deckDetail, deckLoading }: RegisteredDeckProps) {
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{ imageUrl?: string | null; name?: string; rarity?: string } | null>(null);

  const isViewMode = deckDetail !== undefined || deckLoading;
  const isOngoing = tournamentStatus === "ongoing" || tournamentStatus === "finished";

  // Загружаем лидерборд только для "моей колоды" и только при ongoing
  const { data: leaderboardData } = useTournamentLeaderboard(
    !isViewMode && isOngoing && tournamentId ? tournamentId : undefined,
    { limit: 10 },
    { refetchInterval: 5 * 60 * 1000 }
  );

  const myPosition = leaderboardData?.my_position;
  const userPlace = myPosition?.position;
  const deckScore = myPosition?.final_score;

  // В режиме просмотра берём данные из deckDetail
  const position = isViewMode ? deckDetail?.position : userPlace;
  const finalScore = isViewMode ? deckDetail?.final_score : deckScore;
  const prizes = isViewMode ? deckDetail?.prizes : myPosition?.prizes;
  const cards = isViewMode ? (deckDetail?.cards ?? []) : (myDeck ?? []);
  const showCardStats = isViewMode ? true : isOngoing;
  const badgesActive = isViewMode ? !!deckDetail : isOngoing && (userPlace != null || deckScore !== undefined);

  // Форматируем скор
  const formatScore = (score: number | undefined) => {
    if (score === undefined || score === null) return "—";
    return score.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  // Форматируем изменение маркеткапы
  const formatMcapChange = (change: number | null | undefined) => {
    // Если данных нет, показываем 0 зеленым
    if (change === null || change === undefined) {
      return {
        value: "0%",
        isPositive: true,
      };
    }
    const isPositive = change > 0;
    const absChange = Math.abs(change);
    return {
      value: `${absChange.toFixed(2)}%`,
      isPositive,
    };
  };

  const placeLabel = isViewMode ? "PLACE" : "YOUR PLACE";
  const title = isViewMode ? "Deck" : "My deck";

  return (
    <>
      {/* Header */}
      <div className="flex items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-4 relative flex-wrap gap-2 sm:gap-4">
        <h3 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)]">{title}</h3>
        <div className="flex gap-1.5 sm:gap-4 ml-0 flex-nowrap">
          <span
            className={`px-1.5 sm:px-2.5 h-6 sm:h-8 flex items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap ${
              badgesActive ? "text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]" : "text-[var(--badge-purple-text)] bg-[var(--badge-purple-muted)]"
            }`}
          >
            {placeLabel}: {position != null ? position : "—"}
          </span>
          <span
            className={`px-1.5 sm:px-2.5 h-6 sm:h-8 flex items-center text-[10px] sm:text-[13px] font-semibold rounded whitespace-nowrap ${
              badgesActive ? "text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]" : "text-[var(--badge-purple-text)] bg-[var(--badge-purple-muted)]"
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
              className="cursor-pointer px-3 py-0 bg-[var(--primary)] hover:opacity-90 text-white text-sm font-medium rounded-[5px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: "0px 4px 8px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)"
              }}
            >
              {isUnregistering ? "Unregistering..." : "Unregister"}
            </button>
          )}
        </div>
        {!isOngoing && !isViewMode && (
          <p className="text-[13px] font-medium text-[var(--text-primary)] ml-auto">
            Deck stats appears after the tournament&apos;s start
          </p>
        )}
      </div>

      {/* Cards section */}
      <div className="px-4 sm:px-6 pb-6 relative">
        {deckLoading ? (
          <div className="grid grid-cols-3 gap-4 py-6 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="min-w-0 rounded-[14px] bg-[var(--surface-muted)] animate-pulse sm:flex-1 sm:max-w-[220px]"
                style={{
                  aspectRatio: `${CARD_ASPECT_RATIO}`,
                  boxShadow:
                    "0px 180px 51px 0px rgba(64,65,78,0), 0px 116px 46px 0px rgba(64,65,78,0.01), 0px 65px 39px 0px rgba(64,65,78,0.05), 0px 29px 29px 0px rgba(64,65,78,0.09), 0px 7px 16px 0px rgba(64,65,78,0.1)",
                }}
              />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
              {cards.map((card: { user_card_id?: number; card_id?: number; token_name: string; rarity_name?: string; rendered_image_url?: string | null; calculated_score: number; tournament_change?: number | null }, index: number) => {
                const mcapChange = formatMcapChange(card.tournament_change);
                const cardId = card.card_id;
                return (
                  <div key={card.user_card_id ?? card.card_id ?? index} className="min-w-0 flex flex-col sm:flex-1 sm:max-w-[220px]">
                    <div
                      role="button"
                      tabIndex={0}
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
                                <path d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637" stroke="#1EB461" strokeWidth="1.01474" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg width="8" height="11" viewBox="0 0 8 11" fill="none" className="inline rotate-180">
                                <path d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637" stroke="#EF4444" strokeWidth="1.01474" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {mcapChange.value}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 py-6 sm:flex sm:flex-wrap sm:justify-around sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="min-w-0 rounded-[14px] bg-[var(--surface)] sm:flex-1 sm:max-w-[220px]"
                style={{
                  aspectRatio: `${CARD_ASPECT_RATIO}`,
                  boxShadow:
                    "0px 180px 51px 0px rgba(64,65,78,0), 0px 116px 46px 0px rgba(64,65,78,0.01), 0px 65px 39px 0px rgba(64,65,78,0.05), 0px 29px 29px 0px rgba(64,65,78,0.09), 0px 7px 16px 0px rgba(64,65,78,0.1)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CardStatsModal
        open={selectedCardId != null}
        onClose={() => {
          setSelectedCardId(null);
          setSelectedCardInfo(null);
        }}
        cardId={selectedCardId}
        cardImageUrl={selectedCardInfo?.imageUrl}
        cardName={selectedCardInfo?.name}
        cardRarity={selectedCardInfo?.rarity}
      />
    </>
  );
}

export function Deck({
  isRegistered = false,
  onStartClick,
  canRegister = false,
  myDeck,
  tournamentStatus,
  tournamentId,
  onUnregister,
  isUnregistering,
  deckDetail,
  deckLoading,
  wrapInBlurCard = true,
}: DeckProps) {
  const isViewMode = deckDetail !== undefined || deckLoading;

  const content = isViewMode ? (
    <RegisteredDeck
      deckDetail={deckDetail ?? null}
      deckLoading={deckLoading}
      tournamentStatus={tournamentStatus}
      tournamentId={tournamentId}
    />
  ) : isRegistered ? (
    <RegisteredDeck
      myDeck={myDeck}
      tournamentStatus={tournamentStatus}
      tournamentId={tournamentId}
      onUnregister={onUnregister}
      isUnregistering={isUnregistering}
    />
  ) : (
    <EmptyDeck onStartClick={onStartClick ?? (() => {})} canRegister={canRegister} />
  );

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
