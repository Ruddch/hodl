"use client";

import { useState, useMemo, useCallback } from "react";
import type { LeaderboardEntry } from "@/lib/types";
import { LeaderboardTable } from "./LeaderboardTable";
import { BlurCard } from "./BlurCard";
import { DeckDetailModal } from "./DeckDetailModal";
import { SearchInput } from "./SearchInput";

const TABLE_GRID =
  "grid grid-cols-[minmax(0,1.5fr)_minmax(56px,0.5fr)_minmax(100px,1fr)_minmax(64px,0.5fr)] md:grid-cols-4 gap-3 md:gap-4";

const ROW_HEIGHT = 75; // как virtualizer estimateSize в LeaderboardTable

export function LeaderboardTableSkeleton({ fullHeight }: { fullHeight: boolean }) {
  const cardSkeleton = (
    <div className="p-4 rounded-xl border border-[var(--leaderboard-row-border)] bg-[var(--surface)]/50">
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--surface-hover)] animate-pulse border border-[var(--leaderboard-row-border)]" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] animate-pulse shrink-0" />
          <div className="h-4 flex-1 min-w-0 max-w-[140px] bg-[var(--surface-hover)] rounded animate-pulse" />
        </div>
        <div className="h-4 w-24 shrink-0 bg-[var(--surface-hover)] rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
        <div className="h-4 flex-1 bg-[var(--surface-hover)] rounded animate-pulse" />
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--leaderboard-row-border)]">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((j) => (
            <div
              key={j}
              className="w-8 rounded-[7%] bg-[var(--surface-hover)] animate-pulse shrink-0"
              style={{ aspectRatio: "567/889" }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col min-w-0 ${fullHeight ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
      {/* Десктоп — таблица */}
      <div className={`hidden md:flex flex-col min-h-0 ${fullHeight ? "flex-1 overflow-hidden" : ""}`}>
        <div
          className={`grid items-center py-2 border-b border-[var(--leaderboard-row-border)] mb-2 flex-shrink-0 ${TABLE_GRID}`}
        >
          <div className="h-6 w-12 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-6 w-10 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-6 w-12 bg-[var(--surface-hover)] rounded animate-pulse" />
          <div className="h-6 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
        </div>
        <div className={`flex flex-col gap-0 ${fullHeight ? "flex-1 min-h-0 overflow-y-auto overflow-x-hidden" : ""}`}>
          {Array.from(
            { length: fullHeight ? 30 : 5 },
            (_, i) => (
              <div
                key={i}
                className={`grid items-center py-3 border-b border-[var(--leaderboard-row-border)] ${TABLE_GRID}`}
                style={{ minHeight: ROW_HEIGHT }}
              >
                <div className="flex items-center gap-2 md:gap-[18px] min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] animate-pulse shrink-0" />
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-hover)] animate-pulse shrink-0" />
                  <div className="h-4 flex-1 min-w-0 max-w-[120px] bg-[var(--surface-hover)] rounded animate-pulse" />
                </div>
                <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse shrink-0" />
                <div className="flex gap-1.5 items-center [&>*+*]:-ml-4 md:[&>*+*]:ml-0">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div
                      key={j}
                      className="w-8 rounded-[7%] bg-[var(--surface-hover)] animate-pulse shrink-0"
                      style={{ aspectRatio: "567/889" }}
                    />
                  ))}
                </div>
                <div className="h-4 w-16 bg-[var(--surface-hover)] rounded animate-pulse shrink-0" />
              </div>
            )
          )}
        </div>
      </div>

      {/* Мобилка — карточки как в профиле */}
      <div className={`md:hidden space-y-3 ${fullHeight ? "flex-1 min-h-0 overflow-y-auto overflow-x-hidden" : ""}`}>
        {Array.from({ length: fullHeight ? 8 : 3 }, (_, i) => (
          <div key={i}>{cardSkeleton}</div>
        ))}
      </div>
    </div>
  );
}

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
  /** Пагинация: подгрузка при скролле до конца */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** Если передан — поиск серверный: вызываем callback вместо клиентской фильтрации */
  onSearchChange?: (query: string) => void;
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
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onSearchChange,
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

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  }, [onSearchChange]);

  // Когда поиск серверный (onSearchChange передан) — отдаём записи без клиентской фильтрации.
  // Когда поиск клиентский — фильтруем локально.
  const entriesWithMyPosition = useMemo(() => {
    if (onSearchChange) return entries; // серверный поиск — myPosition не закрепляем при поиске
    if (!myPosition || myPosition.position === 1) return entries;
    const firstEntry = entries[0];
    if (firstEntry && firstEntry.user_id === myPosition.user_id) return entries;
    return [myPosition, ...entries];
  }, [entries, myPosition, onSearchChange]);

  const filteredEntries = useMemo(() => {
    // Серверный поиск — фильтрацию делает бек
    if (onSearchChange) return entriesWithMyPosition;

    // Клиентская фильтрация (для превью-карточки без пагинации)
    const trimmed = searchQuery.trim();
    const source = trimmed ? entries : entriesWithMyPosition;
    if (!trimmed) return source;

    const query = trimmed.toLowerCase();
    return source.filter((entry) => {
      if (entry.nickname?.toLowerCase().includes(query)) return true;
      if (entry.wallet_address?.toLowerCase().includes(query)) return true;
      if (String(entry.user_id).includes(query)) return true;
      return false;
    });
  }, [entries, entriesWithMyPosition, searchQuery, onSearchChange]);

  return (
    <BlurCard backgroundColor="rgb(193, 238, 170)" className={`${height === "full" ? "h-full flex flex-col" : ""} min-w-0`}>
      {/* Header */}
      <div
        className={`flex flex-col md:flex-row md:items-center ${showSearch ? "md:justify-between pt-4 md:pt-6" : "pt-6"} gap-4 px-4 sm:px-6  pb-4 flex-shrink-0`}
      >
        <div className={`min-w-0`}>
          <h2 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)] break-words">
            {title}
            {subtitle && <span className="text-lg md:text-xl font-normal text-[var(--text-muted)] ml-2">{subtitle}</span>}
          </h2>
        </div>

        {/* Search */}
        {showSearch && (
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by username or wallet address"
            className="flex items-center w-full md:w-[396px] shrink-0"
            dataPhCaptureAttributeButton="search-leaderboard"
          />
        )}
      </div>

      {/* Table */}
      <div className={`px-4 md:px-6 pb-4 md:pb-6 min-w-0 overflow-hidden ${height === "full" ? "flex-1 min-h-0 flex flex-col" : ""}`}>
        {isLoading ? (
          <LeaderboardTableSkeleton fullHeight={height === "full"} />
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)]">
            {searchQuery ? "No results found" : emptyMessage}
          </div>
        ) : (
          <div className="min-w-0 flex flex-col flex-1 min-h-0 leaderboard-content-fade-in">
            <LeaderboardTable
              entries={filteredEntries}
              height={height === "full" ? undefined : height}
              className={height === "full" ? "flex-1 min-h-0" : ""}
              onDeckClick={tournamentId != null ? handleDeckClick : undefined}
              onLoadMore={onLoadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
            />
          </div>
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
