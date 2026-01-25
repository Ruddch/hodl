"use client";

import Image from "next/image";
import { useTournaments, getTournamentLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMemo, useState, useEffect } from "react";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import type { Tournament, LeaderboardEntry } from "@/lib/types";

interface TournamentStatsRow {
  tournament: Tournament;
  position: number;
  score: number;
  cards: LeaderboardEntry["cards"];
  date: string;
  rewards: number;
  rewardStatus: "available" | "claimed" | "soon";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTournamentName(tournament: Tournament): string {
  const date = new Date(tournament.start_date);
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} fire`;
}

function RewardButton({ 
  status 
}: { 
  status: "available" | "claimed" | "soon" 
}) {
  if (status === "claimed") {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-400 text-white text-sm font-semibold rounded-lg cursor-not-allowed"
      >
        CLAIMED
      </button>
    );
  }

  if (status === "soon") {
    return (
      <span className="text-sm text-black/50">Soon</span>
    );
  }

  return (
    <button
      className="px-4 py-2 bg-[#4A6AFF] hover:bg-[#3A5AEF] text-white text-sm font-semibold rounded-lg transition-colors"
    >
      Claim reward
    </button>
  );
}

export function TournamentStatisticsTable() {
  const { user } = useAuth();
  const [tableData, setTableData] = useState<TournamentStatsRow[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState<Set<number>>(new Set());
  
  // Получаем все турниры, в которых пользователь участвовал
  const { data: tournamentsData, isLoading: tournamentsLoading } = useTournaments({
    limit: 50,
  });

  // Получаем турниры, в которых пользователь зарегистрирован (первые 10 для оптимизации)
  const userTournaments = useMemo(() => {
    const tournaments = tournamentsData?.items
      .filter(t => t.is_registered === true)
      .sort((a, b) => new Date(b.end_date || b.start_date).getTime() - new Date(a.end_date || a.start_date).getTime())
      .slice(0, 10) || [];
    return tournaments;
  }, [tournamentsData]);

  // Загружаем данные для каждого турнира
  useEffect(() => {
    if (!user || userTournaments.length === 0) return;

    const loadTournamentData = async (tournament: Tournament) => {
      // Помечаем турнир как загружаемый
      setLoadingTournaments(prev => new Set(prev).add(tournament.id));

      try {
        const leaderboardData = await getTournamentLeaderboard(tournament.id, { limit: 100 });
        const myPosition = leaderboardData.my_position;

        if (myPosition) {
          const rewards = myPosition.prizes?.reduce(
            (sum, prize) => sum + Number(prize.amount || 0),
            0
          ) || 0;

          // Определяем статус награды (пока заглушка - всегда "available")
          // TODO: Добавить проверку статуса награды из API
          const rewardStatus: "available" | "claimed" | "soon" = "available";

          const rowData: TournamentStatsRow = {
            tournament,
            position: myPosition.position,
            score: myPosition.final_score,
            cards: myPosition.cards || [],
            date: tournament.start_date,
            rewards,
            rewardStatus,
          };

          setTableData(prev => {
            const filtered = prev.filter(row => row.tournament.id !== tournament.id);
            const updated = [...filtered, rowData];
            return updated.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });
        }
      } catch (error) {
        console.error(`Failed to load tournament ${tournament.id}:`, error);
      } finally {
        setLoadingTournaments(prev => {
          const next = new Set(prev);
          next.delete(tournament.id);
          return next;
        });
      }
    };

    // Загружаем данные для всех турниров параллельно
    userTournaments.forEach(tournament => {
      loadTournamentData(tournament);
    });
  }, [user, userTournaments]);

  const isLoading = tournamentsLoading || loadingTournaments.size > 0;

  if (isLoading && tableData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-black/50">Loading tournament statistics...</p>
      </div>
    );
  }

  if (!isLoading && tableData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-black/50">No tournament statistics available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-black/10">
            <th className="text-left py-3 px-4 text-sm font-medium text-black">Tournament</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-black">Score</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-black">Cards</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-black">Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-black">Rewards</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.tournament.id} className="border-b border-black/5">
              {/* Tournament */}
              <td className="py-4 px-4">
                <div>
                  <p className="text-base font-medium text-black">{getTournamentName(row.tournament)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 2L10 6L14 7L11 10L11.5 14L8 12L4.5 14L5 10L2 7L6 6L8 2Z"
                        fill="rgba(0, 0, 0, 0.5)"
                      />
                    </svg>
                    <p className="text-sm text-black/50">{row.position} place</p>
                  </div>
                </div>
              </td>

              {/* Score */}
              <td className="py-4 px-4">
                <p className="text-base font-medium text-black">
                  {row.score.toLocaleString("en-US")}
                </p>
              </td>

              {/* Cards */}
              <td className="py-4 px-4">
                <div className="flex gap-1.5">
                  {row.cards.slice(0, 4).map((card, index) => (
                    <div
                      key={card.card_id || index}
                      className="w-8 rounded-[7%] overflow-hidden bg-white"
                      style={{
                        aspectRatio: `${CARD_ASPECT_RATIO}`,
                      }}
                    >
                      {card.rendered_image_url ? (
                        <Image
                          src={card.rendered_image_url}
                          alt={card.token_name}
                          width={32}
                          height={Math.round(32 / CARD_ASPECT_RATIO)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-200" />
                      )}
                    </div>
                  ))}
                </div>
              </td>

              {/* Date */}
              <td className="py-4 px-4">
                <p className="text-base font-medium text-black">
                  {formatDate(row.date)}
                </p>
              </td>

              {/* Rewards */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <p className="text-base font-medium text-black">
                    {row.rewards.toLocaleString("en-US")}
                  </p>
                  <RewardButton status={row.rewardStatus} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
