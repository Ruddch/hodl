"use client";

import { useTournamentLeaderboardInfinite } from "@/lib/api";
import { useTournamentSelector } from "@/lib/hooks/useTournamentSelector";
import { LeaderboardCard, LeaderboardTableSkeleton } from "@/components/LeaderboardCard";
import { TournamentFilters } from "@/components/tournament";
import { BlurCard } from "@/components/BlurCard";
import { useMemo, useState, useEffect, useCallback, Suspense } from "react";
import { getTournamentDisplayName } from "@/lib/utils/tournaments";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function LeaderboardPageContent() {
  const selector = useTournamentSelector({ defaultStrategy: "finished" });
  const {
    epochKeys,
    currentEpoch,
    tournamentsInEpoch,
    currentTournamentId,
    selectedTournament,
    isLoading: tournamentsLoading,
    onSelectEpoch,
    onSelectTournament,
  } = selector;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTournamentLeaderboardInfinite(
    currentTournamentId ?? undefined,
    { search: debouncedSearch || undefined },
    { refetchInterval: debouncedSearch ? undefined : 5 * 60 * 1000 },
  );

  const allEntries = useMemo(() => {
    if (!leaderboardData?.pages) return [];
    return leaderboardData.pages.flatMap((p) => p.leaderboard);
  }, [leaderboardData]);

  const myPosition = leaderboardData?.pages[0]?.my_position;

  const isLoading = tournamentsLoading || (leaderboardLoading && !leaderboardData);

  const tournamentSubtitle = selectedTournament
    ? getTournamentDisplayName(selectedTournament.id, selectedTournament.start_date)
    : undefined;

  return (
    <>
      <TournamentFilters
        isLoading={tournamentsLoading}
        epochKeys={epochKeys}
        currentEpoch={currentEpoch}
        tournamentsInEpoch={tournamentsInEpoch}
        currentTournamentId={currentTournamentId}
        onSelectEpoch={onSelectEpoch}
        onSelectTournament={onSelectTournament}
        className="mb-4 md:mb-6"
      />

      <LeaderboardCard
        entries={allEntries}
        title="Leaderboard"
        subtitle={tournamentSubtitle}
        showSearch={true}
        height="full"
        isLoading={isLoading}
        emptyMessage={!selectedTournament ? "No tournaments available" : "No participants yet"}
        myPosition={debouncedSearch ? undefined : myPosition}
        tournamentId={selectedTournament?.id}
        onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onSearchChange={handleSearchChange}
      />
    </>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-w-0 h-full">
          {/* Filters — как TournamentFilters loading */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-9 mb-4 md:mb-6">
            <div className="h-12 min-w-[198px] w-40 bg-[var(--surface-elevated)] rounded-[15px] animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-20 bg-[var(--surface-elevated)] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          {/* Card — как LeaderboardCard */}
          <BlurCard backgroundColor="rgb(193, 238, 170)" className="flex-1 min-h-0 flex flex-col min-w-0">
            {/* Header — как LeaderboardCard: pt-4 md:pt-6, title text-xl/2xl leading-8, search h-12 w-[396px] */}
            <div className="flex flex-col md:flex-row md:items-center pt-4 md:pt-6 gap-4 px-4 sm:px-6 pb-4 flex-shrink-0">
              <div className="h-8 w-36 bg-[var(--surface-hover)] rounded animate-pulse" />
              <div className="h-12 w-full md:w-[396px] bg-[var(--surface-hover)] rounded-2xl animate-pulse shrink-0" />
            </div>
            {/* Table skeleton */}
            <div className="flex-1 min-h-0 px-4 md:px-6 pb-4 md:pb-6 overflow-hidden flex flex-col min-w-0">
              <LeaderboardTableSkeleton fullHeight />
            </div>
          </BlurCard>
        </div>
      }
    >
      <LeaderboardPageContent />
    </Suspense>
  );
}
