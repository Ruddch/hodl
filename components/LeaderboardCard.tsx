"use client";

import { useState, useMemo, useCallback } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { LeaderboardTable } from "./LeaderboardTable";
import { BlurCard } from "./BlurCard";
import { DeckDetailModal } from "./DeckDetailModal";

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  height?: number | "full";
  isLoading?: boolean;
  emptyMessage?: string;
  myPosition?: LeaderboardEntry | null;
  tournamentId?: number;
}

export function LeaderboardCard({
  entries,
  title,
  subtitle,
  showSearch = false,
  height = 400,
  isLoading = false,
  emptyMessage = "No participants yet",
  myPosition,
  tournamentId,
}: LeaderboardCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(undefined);

  const handleDeckClick = useCallback((entry: LeaderboardEntry) => {
    if (entry.deck_id != null) {
      setSelectedDeckId(entry.deck_id);
      setDeckModalOpen(true);
    }
  }, []);

  // Добавляем позицию пользователя в начало списка, если она есть и не первая
  const entriesWithMyPosition = useMemo(() => {
    if (!myPosition || myPosition.position === 1) {
      return entries;
    }
    // Проверяем, нет ли уже этой записи в начале списка
    const firstEntry = entries[0];
    if (firstEntry && firstEntry.user_id === myPosition.user_id) {
      return entries;
    }
    // Добавляем myPosition в начало
    return [myPosition, ...entries];
  }, [entries, myPosition]);

  // Фильтруем записи по поисковому запросу
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entriesWithMyPosition;

    const query = searchQuery.toLowerCase().trim();
    return entriesWithMyPosition.filter((entry) => {
      // Поиск по nickname
      if (entry.nickname?.toLowerCase().includes(query)) return true;
      // Поиск по адресу кошелька
      if (entry.wallet_address?.toLowerCase().includes(query)) return true;
      // Поиск по user_id
      if (String(entry.user_id).includes(query)) return true;
      return false;
    });
  }, [entriesWithMyPosition, searchQuery]);

  return (
    <BlurCard backgroundColor="rgba(247, 238, 210, 1)" className={`${height === "full" ? "h-full flex flex-col" : ""} min-w-0`}>
      {/* Header */}
      <div
        className={`flex flex-col md:flex-row md:items-center ${showSearch ? "md:justify-between pt-4 md:pt-6" : "pt-6"} gap-4 px-4 sm:px-6  pb-4 flex-shrink-0`}
      >
        <div className={`min-w-0 ${showSearch ? "pl-10 md:pl-0" : ""}`}>
          <h2 className="text-xl md:text-2xl font-semibold leading-8 text-black break-words">
            {title}
            {subtitle && <span className="text-lg md:text-xl font-normal text-zinc-600 ml-2">{subtitle}</span>}
          </h2>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative flex items-center w-full md:w-auto shrink-0">
            <svg
              className="absolute left-4 w-5 h-5 text-[rgba(0,0,0,0.5)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by username or wallet address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[396px] h-12 px-4 rounded-2xl bg-[rgba(137,137,137,0.14)] border border-[rgba(255,255,255,0.09)] backdrop-blur-[150px] text-base font-normal leading-none tracking-normal text-[rgba(0,0,0,0.5)] placeholder:text-[rgba(0,0,0,0.5)] outline-none focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className={`px-4 md:px-6 pb-4 md:pb-6 min-w-0 overflow-hidden ${height === "full" ? "flex-1 min-h-0 flex flex-col" : ""}`}>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/20 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            {searchQuery ? "No results found" : emptyMessage}
          </div>
        ) : (
          <LeaderboardTable
            entries={filteredEntries}
            height={height === "full" ? undefined : height}
            className={height === "full" ? "flex-1 min-h-0" : ""}
            onDeckClick={tournamentId != null ? handleDeckClick : undefined}
          />
        )}
      </div>

      <DeckDetailModal
        open={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
        tournamentId={tournamentId}
        deckId={selectedDeckId}
      />
    </BlurCard>
  );
}
