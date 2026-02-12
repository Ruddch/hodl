"use client";

import { MainLayout } from "@/components/MainLayout";
import { useTournaments, useTournamentLeaderboard } from "@/lib/api";
import { useMemo } from "react";
import { LeaderboardCard } from "@/components/LeaderboardCard";

export default function LeaderboardPage() {
  // Загружаем турниры
  const { data: tournamentsData, isLoading: tournamentsLoading } = useTournaments({ limit: 50 });

  // Определяем выбранный турнир: последний завершенный или текущий (ongoing)
  const selectedTournament = useMemo(() => {
    if (!tournamentsData?.items.length) return null;

    // Сначала ищем текущий турнир (ongoing)
    const ongoing = tournamentsData.items.find((t) => t.status === "ongoing");
    if (ongoing) return ongoing;

    // Если нет текущего, берем последний завершенный
    const finished = tournamentsData.items
      .filter((t) => t.status === "finished")
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];

    return finished || tournamentsData.items[0];
  }, [tournamentsData]);

  // Загружаем лидерборд выбранного турнира
  const { data: leaderboardData, isLoading: leaderboardLoading } = useTournamentLeaderboard(
    selectedTournament?.id ?? undefined,
    { limit: 100 }
  );

  const isLoading = tournamentsLoading || leaderboardLoading;

  // Форматируем название турнира
  const tournamentSubtitle = selectedTournament
    ? `${new Date(selectedTournament.start_date).toLocaleDateString("en-US", {
        month: "long",
      })} fire`
    : undefined;

  return (
    <MainLayout>
      <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0" style={{ height: 'calc(100vh - 3rem)' }}>
        <LeaderboardCard
          entries={leaderboardData?.leaderboard || []}
          title="Leaderboard"
          subtitle={tournamentSubtitle}
          showSearch={true}
          height="full"
          isLoading={isLoading}
          emptyMessage={!selectedTournament ? "No tournaments available" : "No participants yet"}
          myPosition={leaderboardData?.my_position}
          tournamentId={selectedTournament?.id}
        />
      </div>
    </MainLayout>
  );
}
