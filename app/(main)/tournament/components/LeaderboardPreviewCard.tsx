"use client";

import Image from "next/image";
import Link from "next/link";
import { useTournamentLeaderboard } from "@/lib/api";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { BlurCard } from "@/components/BlurCard";

interface LeaderboardPreviewCardProps {
  tournamentStatus: "registration" | "ongoing" | "finished";
  tournamentId: number | null;
}




// Состояние: турнир еще не стартовал (registration)
function LeaderboardEmpty() {
  return (
    <div data-onboarding="leaderboard-preview">
      <BlurCard backgroundColor="rgba(210, 247, 243, 0.8)">
      {/* Header */}
      <div className="relative px-8 pt-8">
        <h3 className="text-2xl font-semibold leading-8 text-[var(--text-primary)]">Leaderboard</h3>
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center py-8 px-8">
        {/* Изображение пьедестала */}
        <div className="mb-0">
          <Image
            src={"https://back.hodleague.com/static/card_templates/leaderboard_classic_common_20260120_215412.png"}
            alt="Podium"
            width={376}
            height={195}
            className="object-contain"
          />
        </div>

          <p className="text-normal md:text-xl font-semibold text-[var(--text-primary)] text-center">
          You will see your results here after the tournament starts
        </p>
      </div>
    </BlurCard>
    </div>
  );
}

// Состояние: турнир идет (ongoing) или финишировал (finished)
function LeaderboardActive({ tournamentId }: { tournamentId: number }) {
  const { data: leaderboardData, isLoading } = useTournamentLeaderboard(
    tournamentId, 
    { limit: 100 },
    { refetchInterval: 5 * 60 * 1000 } // Обновление каждые 5 минут
  );

  // Получаем всех участников
  const allEntries = leaderboardData?.leaderboard || [];

  return (
    <div data-onboarding="leaderboard-preview" className="relative">
      <LeaderboardCard
        entries={allEntries}
        title="Leaderboard"
        showSearch={false}
        height={400}
        isLoading={isLoading}
        myPosition={leaderboardData?.my_position}
        tournamentId={tournamentId}
      />
      {/* View all link */}
      <Link
        href="/leaderboard"
        className="absolute top-6 right-6 text-base font-medium text-[var(--primary-muted)] hover:text-[var(--primary-muted-hover)] transition-colors"
      >
        View all &gt;
      </Link>
    </div>
  );
}

export function LeaderboardPreviewCard({ tournamentStatus, tournamentId }: LeaderboardPreviewCardProps) {
  if (tournamentStatus === "registration") {
    return <LeaderboardEmpty />;
  }

  if (!tournamentId) {
    return (
      <div
        data-onboarding="leaderboard-preview"
        className="rounded-[30px] border border-[var(--border-subtle)] p-8 text-center text-[var(--text-muted)]"
        style={{
          backgroundColor: "var(--surface-elevated)",
          backdropFilter: "blur(75px)",
        }}
      >
        Select a tournament to view leaderboard
      </div>
    );
  }

  return <LeaderboardActive tournamentId={tournamentId} />;
}
