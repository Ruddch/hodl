"use client";

import type { CardInDeckInfo } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { useTournamentLeaderboard } from "@/lib/api";

interface MyDeckCardProps {
  isRegistered: boolean;
  onStartClick: () => void;
  canRegister: boolean;
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
}

interface EmptyDeckProps {
  onStartClick: () => void;
  canRegister: boolean;
}

function EmptyDeck({ onStartClick, canRegister }: EmptyDeckProps) {
  return (
    <>
      {/* Header */}
      <div className="relative px-8 pt-8">
        <h3 className="text-2xl font-semibold leading-8 text-black">My deck</h3>
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center py-8 px-8">
        {/* Изображение карт */}
        <div className="mb-[-40px]">
          <img 
            src="/deck.png" 
            alt="Deck cards" 
            width={280} 
            height={400}
            className="object-contain"
          />
        </div>

        <p className="text-xl font-semibold text-black mb-6">
          You haven&apos;t registered any deck yet
        </p>

        <button
          onClick={onStartClick}
          disabled={!canRegister}
          className={`px-8 py-3 bg-white rounded-full text-base font-medium flex items-center gap-2 shadow-md transition-colors ${
            canRegister 
              ? "text-[#5B4AD9] hover:bg-gray-50 cursor-pointer" 
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          Let&apos;s start
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}

interface RegisteredDeckProps {
  myDeck?: CardInDeckInfo[] | null;
  tournamentStatus?: "registration" | "ongoing" | "finished";
  tournamentId?: number;
}

function RegisteredDeck({ myDeck, tournamentStatus, tournamentId }: RegisteredDeckProps) {
  const isOngoing = tournamentStatus === "ongoing";
  
  // Загружаем лидерборд только для ongoing турниров
  const { data: leaderboardData } = useTournamentLeaderboard(
    isOngoing && tournamentId ? tournamentId : undefined,
    { limit: 100 },
    { refetchInterval: 5 * 60 * 1000 } // Обновление каждые 5 минут
  );

  const myPosition = leaderboardData?.my_position;
  const userPlace = myPosition?.position;
  const deckScore = myPosition?.final_score;

  // Форматируем скор
  const formatScore = (score: number | undefined) => {
    if (score === undefined || score === null) return "—";
    return score.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  // Форматируем изменение маркеткапы
  const formatMcapChange = (change: number | null | undefined) => {
    // Если данных нет, показываем 0 зеленым
    if (change === null || change === undefined) {
      return {
        value: "0%",
        isPositive: true,
      };
    }
    const isPositive = change > 0;
    const absChange = Math.abs(change);
    return {
      value: `${absChange.toFixed(2)}%`,
      isPositive,
    };
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-4 relative">
        <h3 className="text-2xl font-semibold leading-8 text-black">My deck</h3>
        <div className="flex gap-4 ml-6">
          <span
            className={`px-2.5 h-8 flex items-center text-[13px] font-semibold rounded ${
              isOngoing && userPlace
                ? "text-[#171645] bg-[#CAC1F3]"
                : "text-[#171645] bg-[rgba(169,171,205,0.2)]"
            }`}
          >
            YOUR PLACE: {isOngoing && userPlace ? userPlace : "—"}
          </span>
          <span
            className={`px-2.5 h-8 flex items-center text-[13px] font-semibold rounded ${
              isOngoing && deckScore !== undefined
                ? "text-[#171645] bg-[#CAC1F3]"
                : "text-[#171645] bg-[rgba(169,171,205,0.2)]"
            }`}
          >
            DECK SCORE: {isOngoing && deckScore !== undefined ? `${formatScore(deckScore)}` : "—"}
          </span>
        </div>
        {!isOngoing && (
          <p className="text-[13px] font-medium text-black ml-auto">
            Deck stats appears after the tournament&apos;s start
          </p>
        )}
      </div>

      {/* Cards section */}
      <div className="px-6 pb-6 relative">
        {myDeck && myDeck.length > 0 ? (
          <div className="space-y-4">
            <div className="flex gap-4 justify-around">
              {myDeck.map((card, index) => {
                const mcapChange = formatMcapChange(card.tournament_change);
                return (
                  <div key={card.user_card_id || card.card_id || index} className="flex-1 max-w-[220px]">
                    {/* Карта */}
                    <div
                      className="rounded-[7%] overflow-hidden bg-white mb-2"
                      style={{
                        aspectRatio: `${CARD_ASPECT_RATIO}`,
                        boxShadow:
                          "0px 180px 51px 0px rgba(64,65,78,0), 0px 116px 46px 0px rgba(64,65,78,0.01), 0px 65px 39px 0px rgba(64,65,78,0.05), 0px 29px 29px 0px rgba(64,65,78,0.09), 0px 7px 16px 0px rgba(64,65,78,0.1)",
                      }}
                    >
                      {/* Изображение карты */}
                      {card.rendered_image_url && (
                        <img
                          src={card.rendered_image_url}
                          alt={`${card.token_name} ${card.rarity_name}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {/* Статистика под картой (только для ongoing) */}
                    {isOngoing && (
                      <div className="mt-4">
                        <div className="text-sm font-normal text-black/50 leading-4 tracking-normal flex justify-between items-center">
                          <span>Score:</span>
                          <span className="text-black">{formatScore(card.calculated_score)}</span>
                        </div>
                        <div className="text-sm font-normal leading-8 tracking-normal flex justify-between items-center text-black/50">
                          <span>Price change:</span>
                          <span className={`flex items-center gap-1 ${mcapChange.isPositive ? "text-green-600" : "text-red-600"}`}>
                            {mcapChange.isPositive ? (
                              <>
                                <svg
                                  width="8"
                                  height="11"
                                  viewBox="0 0 8 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="inline"
                                >
                                  <path
                                    d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637"
                                    stroke="#1EB461"
                                    strokeWidth="1.01474"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {mcapChange.value}
                              </>
                            ) : (
                              <>
                                <svg
                                  width="8"
                                  height="11"
                                  viewBox="0 0 8 11"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="inline rotate-180"
                                >
                                  <path
                                    d="M7.37407 3.94074L3.9407 0.50737M3.9407 0.50737L0.507324 3.94074M3.9407 0.50737L3.9407 10.1637"
                                    stroke="#EF4444"
                                    strokeWidth="1.01474"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                {mcapChange.value}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex gap-4 py-6">
            {/* Placeholder если карты еще не загружены */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-[14px] bg-white"
                style={{
                  aspectRatio: `${CARD_ASPECT_RATIO}`,
                  boxShadow:
                    "0px 180px 51px 0px rgba(64,65,78,0), 0px 116px 46px 0px rgba(64,65,78,0.01), 0px 65px 39px 0px rgba(64,65,78,0.05), 0px 29px 29px 0px rgba(64,65,78,0.09), 0px 7px 16px 0px rgba(64,65,78,0.1)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function MyDeckCard({
  isRegistered,
  onStartClick,
  canRegister,
  myDeck,
  tournamentStatus,
  tournamentId,
}: MyDeckCardProps) {
  return (
    <BlurCard blurValue={150} backgroundColor="rgba(141, 121, 253, 0.5)">
      {isRegistered ? (
        <RegisteredDeck
          myDeck={myDeck}
          tournamentStatus={tournamentStatus}
          tournamentId={tournamentId}
        />
      ) : (
        <EmptyDeck onStartClick={onStartClick} canRegister={canRegister} />
      )}
    </BlurCard>
  );
}
