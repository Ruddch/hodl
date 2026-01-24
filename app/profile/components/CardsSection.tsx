"use client";

import Image from "next/image";
import type { UserProfileResponse } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { BlurCard } from "@/components/BlurCard";
import { TournamentStatisticsTable } from "./TournamentStatisticsTable";

interface CardsSectionProps {
  profile: UserProfileResponse;
  activeTab: "cards" | "tournaments";
  onTabChange: (tab: "cards" | "tournaments") => void;
}

export function CardsSection({ profile, activeTab, onTabChange }: CardsSectionProps) {
  const cards = profile.cards || [];

  // Группируем карты по токену для отображения количества
  const cardsByToken = cards.reduce((acc, card) => {
    const key = card.token_symbol;
    if (!acc[key]) {
      acc[key] = {
        token_symbol: card.token_symbol,
        token_name: card.token_name,
        token_image_url: card.token_image_url,
        count: 0,
        cards: [],
      };
    }
    acc[key].count++;
    acc[key].cards.push(card);
    return acc;
  }, {} as Record<string, {
    token_symbol: string;
    token_name: string;
    token_image_url: string;
    count: number;
    cards: typeof cards;
  }>);

  const groupedCards = Object.values(cardsByToken);

  return (
    <BlurCard backgroundColor="rgba(247, 238, 210, 1)">
      <div className="p-8">
        {/* Toggle переключатель */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-[1px] rounded-[16px] p-2" style={{ backgroundColor: 'rgba(137, 137, 137, 0.14)' }}>
            <button
              onClick={() => onTabChange("cards")}
              className={`p-[12px] rounded-[10px] text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                activeTab === "cards"
                  ? "bg-white text-black border border-[rgba(0,0,0,0.08)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                  : "text-black/50 hover:text-black"
              }`}
            >
              My cards
            </button>
            <button
              onClick={() => onTabChange("tournaments")}
              className={`p-[12px] rounded-[10px] text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                activeTab === "tournaments"
                  ? "bg-white text-black border border-[rgba(0,0,0,0.08)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                  : "text-black/50 hover:text-black"
              }`}
            >
              Tournament statistics
            </button>
          </div>

          {activeTab === "cards" && (
            <p className="text-sm text-black/50">
              Cards will be available till 3 Jan, 2026
            </p>
          )}
        </div>

        {/* Контент в зависимости от активной вкладки */}
        {activeTab === "cards" && (
          <div>
            {groupedCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black/50">No cards yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4">
                {groupedCards.map((group) => (
                  <div
                    key={group.token_symbol}
                    className="relative rounded-2xl overflow-hidden border border-white/10 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, rgba(242, 242, 242, 0.5) 0%, rgba(200, 180, 255, 0.3) 100%)"
                    }}
                  >
                    {/* Изображение карты */}
                    <div className="relative" style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}>
                      {group.cards[0]?.rendered_image_url ? (
                        <Image
                          src={group.cards[0].rendered_image_url}
                          alt={group.token_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-purple-200 p-4">
                          {group.token_image_url && (
                            <Image
                              src={group.token_image_url}
                              alt={group.token_symbol}
                              width={48}
                              height={48}
                              className="mb-3"
                            />
                          )}
                          <p className="text-sm font-semibold text-black uppercase text-center">
                            {group.token_name}
                          </p>
                          <p className="text-xs text-black/60 mt-1 uppercase">
                            {group.token_symbol}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Количество карт в правом нижнем углу */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded">
                      {group.count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tournaments" && (
          <TournamentStatisticsTable />
        )}
      </div>
    </BlurCard>
  );
}
