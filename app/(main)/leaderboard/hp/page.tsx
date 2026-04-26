"use client";

import { useUsersHpLeaderboardInfinite } from "@/lib/api";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { hpLeaderboardEntryToLeaderboardRow } from "@/lib/utils/hpLeaderboard";
import { useMemo, useState, useEffect, useCallback } from "react";

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function HpLeaderboardPage() {
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
  } = useUsersHpLeaderboardInfinite(
    { search: debouncedSearch || undefined },
    { refetchInterval: debouncedSearch ? undefined : 5 * 60 * 1000 },
  );

  const allEntries = useMemo(() => {
    if (!leaderboardData?.pages) return [];
    return leaderboardData.pages.flatMap((p) =>
      p.leaderboard.map(hpLeaderboardEntryToLeaderboardRow),
    );
  }, [leaderboardData]);

  const myPositionRaw = leaderboardData?.pages[0]?.my_position;
  const myPosition = useMemo(
    () => (myPositionRaw ? hpLeaderboardEntryToLeaderboardRow(myPositionRaw) : null),
    [myPositionRaw],
  );

  const isLoading = leaderboardLoading && !leaderboardData;

  return (
    <LeaderboardCard
      entries={allEntries}
      title="HP leaderboard"
      subtitle="All-time"
      showSearch={true}
      height="full"
      isLoading={isLoading}
      emptyMessage="No entries yet"
      myPosition={debouncedSearch ? undefined : myPosition}
      onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
      hasMore={!!hasNextPage}
      isLoadingMore={isFetchingNextPage}
      onSearchChange={handleSearchChange}
      tableVariant="hp"
    />
  );
}
