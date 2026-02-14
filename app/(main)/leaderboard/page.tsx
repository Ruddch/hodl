"use client";

import { useTournamentLeaderboardInfinite } from "@/lib/api";
import { useTournamentSelector } from "@/lib/hooks/useTournamentSelector";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { TournamentFilters } from "@/components/tournament";
import { useMemo, Suspense } from "react";

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

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTournamentLeaderboardInfinite(currentTournamentId ?? undefined, {
    refetchInterval: 5 * 60 * 1000,
  });

  const allEntries = useMemo(() => {
    if (!leaderboardData?.pages) return [];
    return leaderboardData.pages.flatMap((p) => p.leaderboard);
  }, [leaderboardData]);

  const myPosition = leaderboardData?.pages[0]?.my_position;

  const isLoading = tournamentsLoading || (leaderboardLoading && !leaderboardData);

  const tournamentSubtitle = selectedTournament
    ? `${new Date(selectedTournament.start_date).toLocaleDateString("en-US", { month: "long" })} fire`
    : undefined;

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0" style={{ height: "calc(100vh - 3rem)" }}>
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
        myPosition={myPosition}
        tournamentId={selectedTournament?.id}
        onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
      />
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0" style={{ height: "calc(100vh - 3rem)" }}>
          <div className="h-10 w-40 bg-[var(--surface-elevated)] rounded-lg animate-pulse mb-6" />
          <div className="flex-1 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
        </div>
      }
    >
      <LeaderboardPageContent />
    </Suspense>
  );
}
