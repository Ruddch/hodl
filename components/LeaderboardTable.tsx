"use client";

import { useRef } from "react";
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

// Компонент ранга
function PositionBadge({ position, isCurrentUser }: { position: number; isCurrentUser: boolean }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "1px solid #CAC1F3",
        fontFamily: "var(--font-league-gothic), sans-serif",
        fontSize: "14px",
        fontWeight: 400,
        lineHeight: "32px",
        letterSpacing: "0%",
        color: "#4E6AFF",
        textAlign: "center",
      }}
    >
      {position}
    </div>
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
  if (!cards || cards.length === 0) {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-8 rounded-[7%] bg-white"
            style={{
              aspectRatio: `${CARD_ASPECT_RATIO}`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {cards.slice(0, 5).map((card, index) => (
        <div
          key={card.card_id || index}
          className="w-8 rounded-[7%] overflow-hidden bg-white"
          style={{
            aspectRatio: `${CARD_ASPECT_RATIO}`,
          }}
        >
          {card.rendered_image_url && (
            <img
              style={{
                aspectRatio: `${CARD_ASPECT_RATIO}`,
              }}
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

// Строка таблицы
function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  // Определяем имя игрока: приоритет nickname, затем wallet_address, затем user_id
  const playerName = entry.nickname 
    ? entry.nickname
    : entry.wallet_address
    ? truncateAddress(entry.wallet_address)
    : `User #${entry.user_id}`;

  const reward = formatReward(entry.prizes);

  return (
    <div
      className={`grid items-center py-3 border-b border-[rgba(0,0,0,0.05)] ${
        isCurrentUser ? "bg-[rgba(242,242,242,0.5)]" : ""
      }`}
      style={{
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "1rem",
      }}
    >
      {/* Player */}
      <div className="flex items-center min-w-0" style={{ gap: "18px" }}>
        <PositionBadge position={entry.position} isCurrentUser={isCurrentUser} />
        <PlayerAvatar 
          walletAddress={entry.wallet_address} 
          userId={entry.user_id} 
          avatarUrl={entry.avatar_url}
        />
        <span className="text-base font-medium text-black truncate">
          {playerName}
          {isCurrentUser && <span className="text-[#5B4AD9] ml-1">(you)</span>}
        </span>
      </div>

      {/* Score */}
      <div>
        <span className="text-base font-medium text-black">
          {formatScore(entry.final_score)}
        </span>
      </div>

      {/* Cards */}
      <div>
        <PlayerCards cards={entry.cards} />
      </div>

      {/* Rewards */}
      <div>
        <span className="text-base font-medium text-black">
        {reward}
      </span>
      </div>
    </div>
  );
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  height?: number;
  className?: string;
}

export function LeaderboardTable({ entries, height, className = "" }: LeaderboardTableProps) {
  const { address } = useAccount();
  const parentRef = useRef<HTMLDivElement>(null);

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
      <div className="py-8 text-center text-zinc-500">
        No participants yet
      </div>
    );
  }

  return (
    <div className={height === undefined ? `flex flex-col ${className}` : className || ""}>
      {/* Table Header */}
      <div
        className="grid items-center py-2 border-b border-[rgba(0,0,0,0.1)] mb-2 flex-shrink-0"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "1rem",
        }}
      >
        <div>
          <span className="text-sm font-medium text-zinc-600">Player</span>
        </div>
        <div>
          <span className="text-sm font-medium text-zinc-600">Score</span>
        </div>
        <div>
          <span className="text-sm font-medium text-zinc-600">Cards</span>
        </div>
        <div>
          <span className="text-sm font-medium text-zinc-600">Rewards</span>
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
                />
              </div>
            );
          })}
        </div>
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
