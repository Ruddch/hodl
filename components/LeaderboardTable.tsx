"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import type { LeaderboardEntry } from "@/lib/types";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { PlayerAvatar } from "./PlayerAvatar";
import { PrizeRewardsDisplay } from "./PrizeRewardsDisplay";

// Функции форматирования
export function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatScore(score: number) {
  const formatted = score.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return formatted;
}

const positionBadgeFramedStyle: CSSProperties = {
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
};

// Компонент ранга: мобилка в таблице — число; десктоп — бейдж. alwaysFramed — всегда бейдж как на десктопе (карточка лидерборда)
function PositionBadge({
  position,
  alwaysFramed,
}: {
  position: number;
  isCurrentUser: boolean;
  /** Карточка на мобилке: тот же бейдж, что и в десктопной таблице */
  alwaysFramed?: boolean;
}) {
  if (alwaysFramed) {
    return (
      <div className="flex items-center justify-center shrink-0" style={positionBadgeFramedStyle}>
        {position}
      </div>
    );
  }
  return (
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
        {position}
      </span>
      <div className="hidden md:flex items-center justify-center shrink-0" style={positionBadgeFramedStyle}>
        {position}
      </div>
    </>
  );
}

// Компонент карт — overlap в таблице; spread в моб. карточке (без наложения)
function PlayerCards({
  cards,
  spread,
}: {
  cards: LeaderboardEntry["cards"];
  spread?: boolean;
}) {
  const cardStyle = { aspectRatio: `${CARD_ASPECT_RATIO}` };
  const emptyCards = [1, 2, 3, 4, 5];
  const rowClass = spread
    ? "flex flex-wrap gap-2"
    : "flex md:gap-1.5 [&>*+*]:-ml-4 md:[&>*+*]:ml-0";

  if (!cards || cards.length === 0) {
    return (
      <div className={rowClass}>
        {emptyCards.map((i) => (
          <div
            key={i}
            className="w-8 md:w-8 rounded-[7%] bg-[var(--surface)] shrink-0"
            style={cardStyle}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={rowClass}>
      {cards.slice(0, 5).map((card, index) => (
        <div
          key={card.card_id || index}
          className="w-8 md:w-8 rounded-[7%] overflow-hidden bg-[var(--surface)] shrink-0 relative"
          style={spread ? cardStyle : { ...cardStyle, zIndex: index }}
        >
          {card.rendered_image_url && (
            <img
              style={cardStyle}
              src={card.rendered_image_url}
              alt={card.token_name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** Мобилка: карточка в стиле Tournament statistics (профиль) */
function LeaderboardMobileCard({
  entry,
  isCurrentUser,
  playerName,
  profileHref,
  canOpenDeck,
  onDeckClick,
  variant = "tournament",
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  playerName: string;
  profileHref: string | null;
  canOpenDeck: boolean;
  onDeckClick: ((entry: LeaderboardEntry) => void) | undefined;
  variant?: "tournament" | "hp";
}) {
  const interactive = canOpenDeck
    ? {
        role: "button" as const,
        tabIndex: 0 as const,
        onClick: () => onDeckClick?.(entry),
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onDeckClick?.(entry);
          }
        },
        "data-ph-capture-attribute-button": "leaderboard-deck-view" as const,
      }
    : {};

  const nameInline = profileHref ? (
    <Link
      href={profileHref}
      onClick={(e) => e.stopPropagation()}
      className="min-w-0 flex-1 text-base font-semibold text-[var(--text-primary)] truncate hover:underline focus:underline focus:outline-none"
      data-ph-capture-attribute-button="leaderboard-profile"
    >
      {playerName}
      {isCurrentUser && <span className="text-[var(--primary-muted)] ml-1">(you)</span>}
    </Link>
  ) : (
    <span className="min-w-0 flex-1 text-base font-semibold text-[var(--text-primary)] truncate">
      {playerName}
      {isCurrentUser && <span className="text-[var(--primary-muted)] ml-1">(you)</span>}
    </span>
  );

  return (
    <div
      {...interactive}
      className={`p-4 rounded-xl border border-[var(--leaderboard-row-border)] bg-[var(--surface)]/50 mb-3 md:hidden ${
        canOpenDeck ? "cursor-pointer transition-colors leaderboard-row-hover" : ""
      }`}
    >
      {/* Одна строка: бейдж как на десктопе | аватар + имя | Score: … */}
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <PositionBadge position={entry.position} isCurrentUser={isCurrentUser} alwaysFramed />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {profileHref ? (
            <Link
              href={profileHref}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 hover:opacity-80 transition-opacity"
              data-ph-capture-attribute-button="leaderboard-profile"
            >
              <PlayerAvatar
                walletAddress={entry.wallet_address}
                userId={entry.user_id}
                avatarUrl={entry.avatar_url}
              />
            </Link>
          ) : (
            <div className="shrink-0">
              <PlayerAvatar
                walletAddress={entry.wallet_address}
                userId={entry.user_id}
                avatarUrl={entry.avatar_url}
              />
            </div>
          )}
          {nameInline}
        </div>
        <div className="shrink-0 pl-1 text-right leading-tight">
          <span className="text-sm text-[var(--text-secondary)]">
            {variant === "hp" ? "HP: " : "Score: "}
          </span>
          <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
            {formatScore(entry.final_score)}
          </span>
        </div>
      </div>

      {variant === "tournament" && (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-[var(--text-secondary)] shrink-0 leading-none">Rewards:</span>
            <span className="text-sm font-medium text-[var(--text-primary)] min-w-0 flex items-center">
              <PrizeRewardsDisplay prizes={entry.prizes} size="sm" />
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--leaderboard-row-border)]">
            <PlayerCards cards={entry.cards} spread />
          </div>
        </>
      )}
    </div>
  );
}

// Строка таблицы — десктоп: сетка; мобилка: карточка (см. LeaderboardMobileCard)
function LeaderboardRow({
  entry,
  isCurrentUser,
  onDeckClick,
  variant = "tournament",
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  onDeckClick: ((entry: LeaderboardEntry) => void) | undefined;
  variant?: "tournament" | "hp";
}) {
  const playerName = entry.nickname
    ? entry.nickname
    : entry.wallet_address
      ? truncateAddress(entry.wallet_address)
      : `User #${entry.user_id}`;

  const canOpenDeck = Boolean(onDeckClick && entry.deck_id != null);

  const profileHref =
    entry.wallet_address
      ? isCurrentUser
        ? "/profile"
        : `/profile?wallet=${encodeURIComponent(entry.wallet_address)}`
      : null;

  const playerCell = (
    <div className="flex items-center gap-2 md:gap-[18px] min-w-0">
      <PositionBadge position={entry.position} isCurrentUser={isCurrentUser} />
      {profileHref ? (
        <Link
          href={profileHref}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 md:gap-[18px] min-w-0 hover:opacity-80 transition-opacity group"
          data-ph-capture-attribute-button="leaderboard-profile"
        >
          <PlayerAvatar
            walletAddress={entry.wallet_address}
            userId={entry.user_id}
            avatarUrl={entry.avatar_url}
          />
          <span className="text-base font-medium text-[var(--text-primary)] truncate group-hover:underline">
            {playerName}
            {isCurrentUser && <span className="text-[var(--primary-muted)] ml-1">(you)</span>}
          </span>
        </Link>
      ) : (
        <>
          <PlayerAvatar
            walletAddress={entry.wallet_address}
            userId={entry.user_id}
            avatarUrl={entry.avatar_url}
          />
          <span className="text-base font-medium text-[var(--text-primary)] truncate">
            {playerName}
            {isCurrentUser && <span className="text-[var(--primary-muted)] ml-1">(you)</span>}
          </span>
        </>
      )}
    </div>
  );

  const rowContent =
    variant === "hp" ? (
      <>
        {playerCell}
        <div className="min-w-0 shrink-0 text-right md:text-left">
          <span className="text-base font-medium tabular-nums text-[var(--text-primary)]">
            {formatScore(entry.final_score)}
          </span>
        </div>
      </>
    ) : (
      <>
        {playerCell}
        <div className="min-w-0 shrink-0">
          <span className="text-base font-medium text-[var(--text-primary)]">
            {formatScore(entry.final_score)}
          </span>
        </div>
        <div>
          <PlayerCards cards={entry.cards} />
        </div>
        <div className="min-w-0 shrink-0">
          <span className="text-base font-medium text-[var(--text-primary)]">
            <PrizeRewardsDisplay prizes={entry.prizes} size="md" />
          </span>
        </div>
      </>
    );

  const rowClassName = `items-center py-3 border-b border-[var(--leaderboard-row-border)] ${
    isCurrentUser ? "" : ""
  } ${
    canOpenDeck ? "cursor-pointer transition-colors leaderboard-row-hover" : ""
  }`;

  const gridClasses =
    variant === "hp"
      ? "grid-cols-[minmax(0,1.5fr)_minmax(88px,0.55fr)] gap-3 md:gap-4"
      : "grid-cols-[minmax(0,1.5fr)_minmax(56px,0.5fr)_minmax(100px,1fr)_minmax(64px,0.5fr)] md:grid-cols-4 gap-3 md:gap-4";

  return (
    <>
      <LeaderboardMobileCard
        entry={entry}
        isCurrentUser={isCurrentUser}
        playerName={playerName}
        profileHref={profileHref}
        canOpenDeck={canOpenDeck}
        onDeckClick={onDeckClick}
        variant={variant}
      />

      <div
        role={canOpenDeck ? "button" : undefined}
        tabIndex={canOpenDeck ? 0 : undefined}
        onClick={canOpenDeck ? () => onDeckClick?.(entry) : undefined}
        data-ph-capture-attribute-button={canOpenDeck ? "leaderboard-deck-view" : undefined}
        onKeyDown={
          canOpenDeck
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDeckClick?.(entry);
                }
              }
            : undefined
        }
        className={`hidden md:grid w-full text-left ${gridClasses} ${rowClassName}`}
      >
        {rowContent}
      </div>
    </>
  );
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  height?: number;
  className?: string;
  onDeckClick?: (entry: LeaderboardEntry) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** HP all-time: две колонки, без колоды и наград */
  variant?: "tournament" | "hp";
}

export function LeaderboardTable({
  entries,
  height,
  className = "",
  onDeckClick,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  variant = "tournament",
}: LeaderboardTableProps) {
  const { address } = useAccount();
  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver для подгрузки при скролле до конца
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const sentinel = sentinelRef.current;
    const scrollParent = parentRef.current;
    if (!sentinel || !scrollParent) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollParent, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Определяем, является ли запись текущим пользователем
  const isCurrentUser = (entry: LeaderboardEntry) => {
    if (!address || !entry.wallet_address) return false;
    return entry.wallet_address.toLowerCase() === address.toLowerCase();
  };

  // Виртуальный скролл
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (variant === "hp" ? 96 : 200),
    measureElement,
    overscan: 5,
  });

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--text-muted)]">
        No participants yet
      </div>
    );
  }

  return (
    <div className={`min-w-0 overflow-hidden ${height === undefined ? `flex flex-col ${className}` : className || ""}`}>
      {/* Table Header — только десктоп (на мобилке карточки без шапки таблицы, как в профиле) */}
      <div
        className={
          variant === "hp"
            ? "hidden md:grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2 flex-shrink-0 grid-cols-[minmax(0,1.5fr)_minmax(88px,0.55fr)] gap-3 md:gap-4"
            : "hidden md:grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2 flex-shrink-0 grid-cols-[minmax(0,1.5fr)_minmax(56px,0.5fr)_minmax(100px,1fr)_minmax(64px,0.5fr)] md:grid-cols-4 gap-3 md:gap-4"
        }
      >
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Player</span>
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">{variant === "hp" ? "HP" : "Score"}</span>
        </div>
        {variant === "tournament" && (
          <>
            <div>
              <span className="text-sm font-medium text-[var(--text-muted)]">Cards</span>
            </div>
            <div>
              <span className="text-sm font-medium text-[var(--text-muted)]">Rewards</span>
            </div>
          </>
        )}
      </div>

      {/* Virtualized Table Rows */}
      <div
        ref={parentRef}
        className={`overflow-y-auto ${height === undefined ? "flex-1 min-h-0" : ""}`}
        style={{
          height: height ? `${height}px` : undefined,
          minHeight: height === undefined ? 0 : undefined,
          position: 'relative',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const entry = entries[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <LeaderboardRow
                  entry={entry}
                  isCurrentUser={isCurrentUser(entry)}
                  onDeckClick={onDeckClick}
                  variant={variant}
                />
              </div>
            );
          })}
        </div>
        {/* Сентинель для подгрузки при скролле */}
        {onLoadMore && hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-4 min-h-[60px]">
            {isLoadingMore && (
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Общий wrapper для контейнера лидерборда
export function LeaderboardWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-[30px] overflow-hidden border border-white/10 ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(242, 242, 242, 0.9) 0%, rgba(248, 242, 223, 0.6) 100%)",
        boxShadow:
          "34px 243px 69px 0px rgba(214,214,214,0), 22px 156px 63px 0px rgba(214,214,214,0.01), 12px 88px 53px 0px rgba(214,214,214,0.05), 6px 39px 39px 0px rgba(214,214,214,0.09), 1px 10px 22px 0px rgba(214,214,214,0.1)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(247, 238, 210, 0.6) 0%, rgba(247, 238, 210, 0.4) 30%, transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}
