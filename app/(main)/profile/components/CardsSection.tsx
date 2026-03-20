"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { UserProfileResponse } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { BlurCard } from "@/components/BlurCard";
import { CardStatsModal } from "@/components/CardStatsModalLazy";
import { ProfileHoloCard } from "@/components/ProfileHoloCard";
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

  // Отображаем все карты поштучно, не скрывая дубликаты
  const visibleCards = cards;
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
              data-ph-capture-attribute-button="profile-tab-cards"
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
                data-ph-capture-attribute-button="profile-tab-tournaments"
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
            {visibleCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No cards yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {visibleCards.map((card, index) => {
                  const cardId = card.card_id;

                  const handleClick = () => {
                    if (cardId != null) {
                      setSelectedCardId(cardId);
                      setSelectedCardInfo({
                        imageUrl: card.rendered_image_url,
                        name: card.token_name,
                      });
                    }
                  };

                  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (cardId != null && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setSelectedCardId(cardId);
                      setSelectedCardInfo({
                        imageUrl: card.rendered_image_url,
                        name: card.token_name,
                      });
                    }
                  };

                  const sharedProps = {
                    role: "button" as const,
                    tabIndex: 0,
                    "data-ph-capture-attribute-button": "profile-card-view",
                    onClick: handleClick,
                    onKeyDown: handleKeyDown,
                    className: "relative rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm cursor-pointer",
                    style: { background: "var(--profile-card-bg)" } as React.CSSProperties,
                  };

                  const cardImage = (
                    <div className="relative" style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}>
                      {card.rendered_image_url ? (
                        <Image
                          src={card.rendered_image_url}
                          alt={card.token_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--badge-purple-muted)] p-4">
                          {card.token_image_url && (
                            <Image
                              src={card.token_image_url}
                              alt={card.token_symbol}
                              width={48}
                              height={48}
                              className="mb-3"
                            />
                          )}
                          <p className="text-sm font-semibold text-[var(--text-primary)] uppercase text-center">
                            {card.token_name}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 uppercase">
                            {card.token_symbol}
                          </p>
                        </div>
                      )}
                    </div>
                  );

                  // if (index === 0) {
                  //   return (
                  //     <CosmosHoloCard key={card.card_id ?? `${card.token_symbol}-${index}`} {...sharedProps}>
                  //       {cardImage}
                  //     </CosmosHoloCard>
                  //   );
                  // }
                  // if (index === 1) {
                  //   return (
                  //     <HoloRareCard key={card.card_id ?? `${card.token_symbol}-${index}`} {...sharedProps}>
                  //       {cardImage}
                  //     </HoloRareCard>
                  //   );
                  // }
                  // if (index === 2) {
                  //   return (
                  //     <ReverseHoloCard key={card.card_id ?? `${card.token_symbol}-${index}`} {...sharedProps}>
                  //       {cardImage}
                  //     </ReverseHoloCard>
                  //   );
                  // }
                  return (
                    <ProfileHoloCard key={card.user_card_id ?? `${card.token_symbol}-${index}`} {...sharedProps}>
                      {cardImage}
                    </ProfileHoloCard>
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

      {selectedCardId != null && (
        <CardStatsModal
          open
          onClose={() => {
            setSelectedCardId(null);
            setSelectedCardInfo(null);
          }}
          cardId={selectedCardId}
          cardImageUrl={selectedCardInfo?.imageUrl}
          cardName={selectedCardInfo?.name}
        />
      )}
    </BlurCard>
  );
}
