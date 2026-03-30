"use client";

import { useMyTournaments, useClaimTournamentRewards } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { CardStatsModal } from "@/components/CardStatsModalLazy";
import { PrizeRewardsDisplay } from "@/components/PrizeRewardsDisplay";
import type { MyTournamentEntry, MyTournamentCard } from "@/lib/types";

const gridClasses =
  "grid gap-3 md:gap-4 grid-cols-[minmax(0,1.2fr)_minmax(48px,0.5fr)_minmax(80px,1fr)_minmax(70px,0.6fr)_minmax(56px,0.5fr)_minmax(80px,auto)]";

function TournamentStatisticsSkeleton() {
  return (
    <div className="min-w-0 overflow-x-auto">
      {/* Desktop skeleton */}
      <div className="hidden md:block min-w-0">
        <div className={`${gridClasses} grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2`}>
          <div className="h-4 w-20 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-4 w-12 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-4 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${gridClasses} grid items-center py-3 border-b border-[var(--leaderboard-row-border)]`}
          >
            <div className="flex flex-col gap-1.5">
              <div className="h-4 w-28 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-3.5 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
            <div className="h-4 w-12 bg-[var(--surface-hover)] rounded animate-pulse" />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div
                  key={j}
                  className="w-8 rounded-[7%] bg-[var(--surface-hover)] animate-pulse shrink-0"
                  style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                />
              ))}
            </div>
            <div className="h-4 w-20 bg-[var(--surface-hover)] rounded animate-pulse" />
            <div className="h-4 w-10 bg-[var(--surface-hover)] rounded animate-pulse" />
            <div />
          </div>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[var(--leaderboard-row-border)] bg-[var(--surface)]/50"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-28 bg-[var(--surface-hover)] rounded animate-pulse" />
                <div className="h-3 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
              </div>
              <div className="h-4 w-20 bg-[var(--surface-hover)] rounded animate-pulse shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-12 bg-[var(--surface-hover)] rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--leaderboard-row-border)]">
              <div className="h-3 w-12 bg-[var(--surface-hover)] rounded animate-pulse mb-2" />
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div
                    key={j}
                    className="w-8 rounded-[7%] bg-[var(--surface-hover)] animate-pulse shrink-0"
                    style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

function hasUnclaimedRewards(entry: MyTournamentEntry): boolean {
  return (entry.prizes ?? []).some(
    (p) => p.claim_status !== "claimed" && p.claim_status !== null
  );
}

function hasAnyRewards(entry: MyTournamentEntry): boolean {
  return (entry.prizes ?? []).length > 0;
}

interface ClaimButtonProps {
  tournamentId: number;
  onClaim: (tournamentId: number) => void;
  isPending: boolean;
  isSuccess: boolean;
}

function ClaimButton({ tournamentId, onClaim, isPending, isSuccess }: ClaimButtonProps) {
  if (isSuccess) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center gap-1.5 w-24 py-2 rounded-lg text-sm font-semibold
          bg-[var(--surface-hover)] text-[var(--text-secondary)]
          cursor-not-allowed opacity-70"
        data-ph-capture-attribute-button="tournament-claimed"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Claimed
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => onClaim(tournamentId)}
      className="inline-flex items-center justify-center w-24 py-2 rounded-lg text-sm font-semibold
        bg-[var(--primary)] text-[var(--primary-foreground,#fff)]
        hover:opacity-90 active:scale-95 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-1"
      data-ph-capture-attribute-button="tournament-claim"
    >
      {isPending ? (
        <svg
          className="animate-spin"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.8" />
          <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        "Claim"
      )}
    </button>
  );
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
              "data-ph-capture-attribute-button": "tournament-stats-card",
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
  const claimMutation = useClaimTournamentRewards();
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set());
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

  const handleClaim = (tournamentId: number) => {
    claimMutation.mutate(tournamentId, {
      onSuccess: () => {
        setClaimedIds((prev) => new Set(prev).add(tournamentId));
      },
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
        canClaim: hasUnclaimedRewards(t),
        hasRewards: hasAnyRewards(t),
      }))
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [data]);

  if (isLoading && tableData.length === 0) {
    return <TournamentStatisticsSkeleton />;
  }

  if (tableData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">No tournament statistics available</p>
      </div>
    );
  }

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
          <div />
        </div>

        {/* Rows */}
        {tableData.map((row) => {
          const isClaiming =
            claimMutation.isPending &&
            claimMutation.variables === row.entry.tournament_id;
          const isClaimed = claimedIds.has(row.entry.tournament_id);

          return (
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
                  <PrizeRewardsDisplay prizes={row.entry.prizes} size="md" />
                </span>
              </div>
              <div className="flex items-center justify-end">
                {row.hasRewards && (
                  <ClaimButton
                    tournamentId={row.entry.tournament_id}
                    onClaim={handleClaim}
                    isPending={isClaiming}
                    isSuccess={isClaimed || !row.canClaim}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: карточки */}
      <div className="md:hidden space-y-3">
        {tableData.map((row) => {
          const isClaiming =
            claimMutation.isPending &&
            claimMutation.variables === row.entry.tournament_id;
          const isClaimed = claimedIds.has(row.entry.tournament_id);

          return (
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
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-[var(--text-secondary)] shrink-0">Rewards:</span>
                    <span className="text-sm font-medium text-[var(--text-primary)] min-w-0">
                      <PrizeRewardsDisplay prizes={row.entry.prizes} size="md" />
                    </span>
                  </div>
                  {row.hasRewards && (
                    <ClaimButton
                      tournamentId={row.entry.tournament_id}
                      onClaim={handleClaim}
                      isPending={isClaiming}
                      isSuccess={isClaimed || !row.canClaim}
                    />
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--leaderboard-row-border)]">
                <span className="text-sm text-[var(--text-secondary)] block mb-2">
                  Cards
                </span>
                <TournamentCards cards={row.cards} onCardClick={handleCardClick} />
              </div>
            </div>
          );
        })}
      </div>
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
    </>
  );
}
