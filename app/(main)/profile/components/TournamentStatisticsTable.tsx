"use client";

import { useMyTournaments } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { CardStatsModal } from "@/components/CardStatsModal";
import type { MyTournamentEntry, MyTournamentCard } from "@/lib/types";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getTournamentName(entry: MyTournamentEntry): string {
  const date = new Date(entry.end_date || entry.start_date);
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} fire`;
}

function formatScore(score: number): string {
  return score.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

interface TournamentCardsProps {
  cards: MyTournamentCard[];
  onCardClick?: (card: MyTournamentCard) => void;
}

function TournamentCards({ cards, onCardClick }: TournamentCardsProps) {
  const cardStyle = { aspectRatio: `${CARD_ASPECT_RATIO}` };
  const emptyCards = [1, 2, 3, 4, 5];

  if (!cards || cards.length === 0) {
    return (
      <div className="flex gap-1.5">
        {emptyCards.slice(0, 5).map((i) => (
          <div
            key={i}
            className="w-8 rounded-[7%] bg-[var(--surface)] shrink-0"
            style={cardStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {cards.slice(0, 5).map((card, index) => {
        const CardWrapper = onCardClick ? "button" : "div";
        const wrapperProps = onCardClick
          ? {
              onClick: () => onCardClick(card),
              className: "w-8 rounded-[7%] overflow-hidden bg-[var(--surface)] shrink-0 relative cursor-pointer hover:ring-2 hover:ring-[var(--primary-muted)]/50 hover:ring-offset-1 transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--primary-muted)]",
              type: "button" as const,
            }
          : {
              className: "w-8 rounded-[7%] overflow-hidden bg-[var(--surface)] shrink-0 relative",
            };
        return (
          <CardWrapper
            key={card.card_id || index}
            style={{ ...cardStyle, zIndex: index }}
            {...wrapperProps}
          >
            {card.rendered_image_url && (
              <img
                style={cardStyle}
                src={card.rendered_image_url}
                alt={card.token_name}
                className="w-full h-full object-cover pointer-events-none"
              />
            )}
          </CardWrapper>
        );
      })}
    </div>
  );
}

export function TournamentStatisticsTable() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useMyTournaments(isAuthenticated);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{
    imageUrl?: string | null;
    name?: string;
    rarity?: string;
  } | null>(null);

  const handleCardClick = (card: MyTournamentCard) => {
    setSelectedCardId(card.card_id);
    setSelectedCardInfo({
      imageUrl: card.rendered_image_url,
      name: card.token_name,
      rarity: card.rarity_name,
    });
  };

  const tableData = useMemo(() => {
    const tournaments = data?.tournaments ?? [];
    return tournaments
      .filter((t) => t.status === "finished")
      .map((t) => ({
        entry: t,
        position: t.position,
        score: t.final_score,
        cards: t.cards,
        date: t.end_date || t.start_date,
        rewards:
          t.prizes?.reduce((sum, p) => sum + Number(p.amount || 0), 0) ?? 0,
      }))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [data]);

  if (isLoading && tableData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Loading tournament statistics...</p>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">No tournament statistics available</p>
      </div>
    );
  }

  const gridClasses =
    "grid gap-3 md:gap-4 grid-cols-[minmax(0,1.2fr)_minmax(48px,0.5fr)_minmax(80px,1fr)_minmax(70px,0.6fr)_minmax(56px,0.5fr)]";
  const headerClasses =
    "grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2 flex-shrink-0";
  const rowClasses =
    "grid items-center py-3 border-b border-[var(--leaderboard-row-border)]";

  return (
    <>
    <div className="min-w-0 overflow-x-auto">
      {/* Desktop: таблица */}
      <div className="hidden md:block min-w-0">
        {/* Header */}
        <div className={`${gridClasses} ${headerClasses}`}>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Tournament
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Score
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Cards
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Date
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Rewards
            </span>
          </div>
        </div>

        {/* Rows */}
        {tableData.map((row) => (
          <div
            key={row.entry.tournament_id}
            className={`${gridClasses} ${rowClasses}`}
          >
            <div className="min-w-0">
              <Link
                href={`/leaderboard?tournamentId=${row.entry.tournament_id}`}
                className="text-base font-semibold text-[var(--text-primary)] truncate block hover:underline focus:underline focus:outline-none"
              >
                {getTournamentName(row.entry)}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg width="17" height="8" viewBox="0 0 17 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                  <mask id="chart-1-inside" fill="white">
                    <rect y="3" width="5" height="5" rx="1" />
                  </mask>
                  <rect y="3" width="5" height="5" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-1-inside)" fill="transparent" />
                  <mask id="chart-2-inside" fill="white">
                    <rect x="12" y="5" width="5" height="3" rx="1" />
                  </mask>
                  <rect x="12" y="5" width="5" height="3" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-2-inside)" fill="transparent" />
                  <mask id="chart-3-inside" fill="white">
                    <rect x="6" width="5" height="8" rx="1" />
                  </mask>
                  <rect x="6" width="5" height="8" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-3-inside)" fill="transparent" />
                </svg>
                <span
                  className="text-[var(--text-secondary)]"
                  style={{
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "32px",
                    letterSpacing: "0%",
                  }}
                >
                  {getOrdinal(row.position)} place
                </span>
              </div>
            </div>
            <div className="min-w-0 shrink-0">
              <span className="text-base font-medium text-[var(--text-primary)]">
                {formatScore(row.score)}
              </span>
            </div>
            <div>
              <TournamentCards cards={row.cards} onCardClick={handleCardClick} />
            </div>
            <div className="min-w-0 shrink-0">
              <span className="text-base font-medium text-[var(--text-primary)]">
                {formatDate(row.date)}
              </span>
            </div>
            <div className="min-w-0 shrink-0">
              <span className="text-base font-medium text-[var(--text-primary)]">
                {row.rewards.toLocaleString("en-US")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: карточки */}
      <div className="md:hidden space-y-3">
        {tableData.map((row) => (
          <div
            key={row.entry.tournament_id}
            className="p-4 rounded-xl border border-[var(--leaderboard-row-border)] bg-[var(--surface)]/50"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <Link
                  href={`/leaderboard?tournamentId=${row.entry.tournament_id}`}
                  className="text-base font-semibold text-[var(--text-primary)] block hover:underline focus:underline focus:outline-none"
                >
                  {getTournamentName(row.entry)}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <svg width="17" height="8" viewBox="0 0 17 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
                    <mask id="chart-m1-inside" fill="white">
                      <rect y="3" width="5" height="5" rx="1" />
                    </mask>
                    <rect y="3" width="5" height="5" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-m1-inside)" fill="transparent" />
                    <mask id="chart-m2-inside" fill="white">
                      <rect x="12" y="5" width="5" height="3" rx="1" />
                    </mask>
                    <rect x="12" y="5" width="5" height="3" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-m2-inside)" fill="transparent" />
                    <mask id="chart-m3-inside" fill="white">
                      <rect x="6" width="5" height="8" rx="1" />
                    </mask>
                    <rect x="6" width="5" height="8" rx="1" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2.6" mask="url(#chart-m3-inside)" fill="transparent" />
                  </svg>
                  <span
                    className="text-[var(--text-secondary)]"
                    style={{
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "32px",
                      letterSpacing: "0%",
                    }}
                  >
                    {getOrdinal(row.position)} place
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] shrink-0">
                {formatDate(row.date)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)]">Score:</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {formatScore(row.score)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)]">Rewards:</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {row.rewards.toLocaleString("en-US")}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--leaderboard-row-border)]">
              <span className="text-sm text-[var(--text-secondary)] block mb-2">
                Cards
              </span>
              <TournamentCards cards={row.cards} onCardClick={handleCardClick} />
            </div>
          </div>
        ))}
      </div>
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
