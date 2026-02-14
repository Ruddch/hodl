"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { LeaderboardEntry } from "@/lib/types";
import type { ReactNode } from "react";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { Avatar } from "./Avatar";

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

// Форматирование награды 
function formatReward(prizes: LeaderboardEntry["prizes"]): string {
  if (!prizes || prizes.length === 0) return "—";
  
  const firstPrize = prizes[0];
  const amount = Number(firstPrize.amount);
  const formattedAmount = new Intl.NumberFormat("en-US").format(amount);
  
  return `${formattedAmount} ${firstPrize.reward_name}`;
}

// Компонент ранга: мобилка — просто число, десктоп — бейдж в рамке
function PositionBadge({ position }: { position: number; isCurrentUser: boolean }) {
  return (
    <>
      {/* Мобилка: без рамки */}
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
      {/* Десктоп: бейдж с рамкой */}
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
        {position}
      </div>
    </>
  );
}

// Компонент аватарки
function PlayerAvatar({ 
  walletAddress, 
  userId, 
  avatarUrl 
}: { 
  walletAddress: string | null | undefined; 
  userId: number;
  avatarUrl?: string | null;
}) {
  return <Avatar walletAddress={walletAddress} fallbackSeed={userId} size={40} avatarUrl={avatarUrl} />;
}

// Компонент карт
function PlayerCards({ cards }: { cards: LeaderboardEntry["cards"] }) {
  const cardStyle = { aspectRatio: `${CARD_ASPECT_RATIO}` };
  const emptyCards = [1, 2, 3, 4, 5];

  if (!cards || cards.length === 0) {
    return (
      <div className="flex md:gap-1.5 [&>*+*]:-ml-4 md:[&>*+*]:ml-0">
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
    <div className="flex md:gap-1.5 [&>*+*]:-ml-4 md:[&>*+*]:ml-0">
      {cards.slice(0, 5).map((card, index) => (
        <div
          key={card.card_id || index}
          className="w-8 md:w-8 rounded-[7%] overflow-hidden bg-[var(--surface)] shrink-0 relative"
          style={{ ...cardStyle, zIndex: index }}
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

// Строка таблицы (вся строка кликабельна для открытия модалки колоды)
function LeaderboardRow({
  entry,
  isCurrentUser,
  onDeckClick,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
  onDeckClick: ((entry: LeaderboardEntry) => void) | undefined;
}) {
  const playerName = entry.nickname
    ? entry.nickname
    : entry.wallet_address
      ? truncateAddress(entry.wallet_address)
      : `User #${entry.user_id}`;

  const reward = formatReward(entry.prizes);
  const canOpenDeck = onDeckClick && entry.deck_id != null;

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

  const rowContent = (
    <>
      {/* Player */}
      {playerCell}

      {/* Score */}
      <div className="min-w-0 shrink-0">
        <span className="text-base font-medium text-[var(--text-primary)]">
          {formatScore(entry.final_score)}
        </span>
      </div>

      {/* Cards */}
      <div>
        <PlayerCards cards={entry.cards} />
      </div>

      {/* Rewards */}
      <div className="min-w-0 shrink-0">
        <span className="text-base font-medium text-[var(--text-primary)]">{reward}</span>
      </div>
    </>
  );

  const rowClassName = `items-center py-3 border-b border-[var(--leaderboard-row-border)] ${
    isCurrentUser ? "" : ""
  } ${
    canOpenDeck ? "cursor-pointer transition-colors leaderboard-row-hover" : ""
  }`;

  const gridClasses =
    "grid-cols-[minmax(0,1.5fr)_minmax(56px,0.5fr)_minmax(100px,1fr)_minmax(64px,0.5fr)] md:grid-cols-4 gap-3 md:gap-4";

  const rowElement = (
    <div
      role={canOpenDeck ? "button" : undefined}
      tabIndex={canOpenDeck ? 0 : undefined}
      onClick={canOpenDeck ? () => onDeckClick?.(entry) : undefined}
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
      className={`w-full text-left grid ${gridClasses} ${rowClassName}`}
    >
      {rowContent}
    </div>
  );

  return rowElement;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  height?: number;
  className?: string;
  onDeckClick?: (entry: LeaderboardEntry) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function LeaderboardTable({ entries, height, className = "", onDeckClick, onLoadMore, hasMore = false, isLoadingMore = false }: LeaderboardTableProps) {
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
    estimateSize: () => 75,
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
      {/* Table Header */}
      <div
        className="grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2 flex-shrink-0 grid-cols-[minmax(0,1.5fr)_minmax(56px,0.5fr)_minmax(100px,1fr)_minmax(64px,0.5fr)] md:grid-cols-4 gap-3 md:gap-4"
      >
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Player</span>
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Score</span>
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Cards</span>
        </div>
        <div>
          <span className="text-sm font-medium text-[var(--text-muted)]">Rewards</span>
        </div>
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
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <LeaderboardRow
                  entry={entry}
                  isCurrentUser={isCurrentUser(entry)}
                  onDeckClick={onDeckClick}
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
