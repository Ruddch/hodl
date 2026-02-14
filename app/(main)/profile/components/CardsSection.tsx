"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { UserProfileResponse } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { BlurCard } from "@/components/BlurCard";
import { CardStatsModal } from "@/components/CardStatsModal";
import { TournamentStatisticsTable } from "./TournamentStatisticsTable";

interface CardsSectionProps {
  profile: UserProfileResponse;
  activeTab: "cards" | "tournaments";
  onTabChange: (tab: "cards" | "tournaments") => void;
  /** Показывать вкладку «Статистика турниров» — только для своего профиля */
  showTournamentStats?: boolean;
}

export function CardsSection({ profile, activeTab, onTabChange, showTournamentStats = true }: CardsSectionProps) {
  const cards = profile.cards || [];

  // При просмотре чужого профиля переключаем на «Мои карты»
  useEffect(() => {
    if (!showTournamentStats && activeTab === "tournaments") {
      onTabChange("cards");
    }
  }, [showTournamentStats, activeTab, onTabChange]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [selectedCardInfo, setSelectedCardInfo] = useState<{ imageUrl?: string | null; name?: string } | null>(null);

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
  const expiresAt = cards[0]?.expires_at;
  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <BlurCard backgroundColor="rgba(247, 238, 210, 1)">
      <div data-onboarding="profile-cards" className="p-4 sm:p-6 md:p-8">
        {/* Toggle переключатель */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex gap-[1px] rounded-[16px] p-2 w-fit bg-[var(--input-bg)]">
            <button
              onClick={() => onTabChange("cards")}
              className={`p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                activeTab === "cards"
                  ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              My cards
            </button>
            {showTournamentStats && (
              <button
                onClick={() => onTabChange("tournaments")}
                className={`p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center transition-colors whitespace-nowrap ${
                  activeTab === "tournaments"
                    ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                Tournament statistics
              </button>
            )}
          </div>

          {activeTab === "cards" && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {expiresLabel
                ? `Cards will be available till ${expiresLabel}`
                : "Cards will be available till next tournament"}
            </p>
          )}
        </div>

        {/* Контент в зависимости от активной вкладки */}
        {activeTab === "cards" && (
          <div>
            {groupedCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No cards yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {groupedCards.map((group) => {
                  const firstCard = group.cards[0];
                  const cardId = firstCard?.card_id;
                  return (
                  <div
                    key={group.token_symbol}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (cardId != null) {
                        setSelectedCardId(cardId);
                        setSelectedCardInfo({
                          imageUrl: firstCard?.rendered_image_url,
                          name: group.token_name,
                        });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (cardId != null && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setSelectedCardId(cardId);
                        setSelectedCardInfo({
                          imageUrl: firstCard?.rendered_image_url,
                          name: group.token_name,
                        });
                      }
                    }}
                    className="relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm cursor-pointer hover:ring-2 hover:ring-[var(--primary-muted)]/50 hover:ring-offset-2 transition-shadow"
                    style={{
                      background: "var(--profile-card-bg)"
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
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--badge-purple-muted)] p-4">
                          {group.token_image_url && (
                            <Image
                              src={group.token_image_url}
                              alt={group.token_symbol}
                              width={48}
                              height={48}
                              className="mb-3"
                            />
                          )}
                          <p className="text-sm font-semibold text-[var(--text-primary)] uppercase text-center">
                            {group.token_name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 uppercase">
                            {group.token_symbol}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "tournaments" && showTournamentStats && (
          <TournamentStatisticsTable />
        )}
      </div>

      <CardStatsModal
        open={selectedCardId != null}
        onClose={() => {
          setSelectedCardId(null);
          setSelectedCardInfo(null);
        }}
        cardId={selectedCardId}
        cardImageUrl={selectedCardInfo?.imageUrl}
        cardName={selectedCardInfo?.name}
      />
    </BlurCard>
  );
}
