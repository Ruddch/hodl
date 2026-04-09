"use client";

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useMyProfile } from "@/lib/api";
import type { UserCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { SearchInput } from "@/components/SearchInput";
import { isCommonRarity } from "@/lib/forge";

interface ForgeCardSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (card: UserCard) => void;
  /** Если задано — в списке только карты с этим `card_id` (вторая копия rare) */
  sameCardIdAs?: number;
  /** Эти `user_card_id` нельзя выбрать (уже в слотах) */
  excludeUserCardIds?: number[];
  /** Только common (доп. слоты burn) */
  commonOnly?: boolean;
  /** Оставить карты с той же эффективной сетью: `card.chain_id ?? walletChainId` */
  matchChainId?: number;
  walletChainId?: number;
  /** Фильтр по токену (Upgrade: только одинаковый token_symbol) */
  matchTokenSymbol?: string;
  /** Фильтр по редкости (Upgrade: только одинаковая rarity_name) */
  matchRarityName?: string;
  /** Исключить карты с этими редкостями */
  excludeRarityNames?: string[];
  title?: string;
  subtitle?: string;
}

export function ForgeCardSelectModal({
  open,
  onClose,
  onSelect,
  sameCardIdAs,
  excludeUserCardIds = [],
  commonOnly = false,
  matchChainId,
  walletChainId,
  matchTokenSymbol,
  matchRarityName,
  excludeRarityNames,
  title = "Placeholder title",
  subtitle = "Placeholder subtitle.",
}: ForgeCardSelectModalProps) {
  const { data: profile, isLoading } = useMyProfile(true, open);
  const [searchQuery, setSearchQuery] = useState("");

  const excludeSet = useMemo(() => new Set(excludeUserCardIds), [excludeUserCardIds]);

  const cards = useMemo(() => {
    let list = profile?.cards?.filter((c) => c.status === "available" && !excludeSet.has(c.user_card_id)) ?? [];
    if (sameCardIdAs != null) {
      list = list.filter((c) => c.card_id === sameCardIdAs);
    }
    if (commonOnly) {
      list = list.filter((c) => isCommonRarity(c));
    }
    if (matchChainId != null) {
      list = list.filter((c) => (c.chain_id ?? walletChainId) === matchChainId);
    }
    if (matchTokenSymbol != null) {
      const sym = matchTokenSymbol.toLowerCase();
      list = list.filter((c) => c.token_symbol.toLowerCase() === sym);
    }
    if (matchRarityName != null) {
      const rar = matchRarityName.trim().toLowerCase();
      list = list.filter((c) => c.rarity_name.trim().toLowerCase() === rar);
    }
    if (excludeRarityNames != null && excludeRarityNames.length > 0) {
      const excluded = new Set(excludeRarityNames.map((r) => r.trim().toLowerCase()));
      list = list.filter((c) => !excluded.has(c.rarity_name.trim().toLowerCase()));
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.token_name.toLowerCase().includes(q) || c.token_symbol.toLowerCase().includes(q)
    );
  }, [profile?.cards, searchQuery, sameCardIdAs, excludeSet, commonOnly, matchChainId, walletChainId, matchTokenSymbol, matchRarityName, excludeRarityNames]);

  useEffect(() => {
    if (!open) setSearchQuery("");
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
        aria-hidden
      />

      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[960px] bg-[var(--surface)] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden sm:mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forge-card-modal-title"
      >
        <div className="p-4 sm:p-6 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h2
                id="forge-card-modal-title"
                className="text-base sm:text-xl font-bold text-[var(--text-primary)] leading-tight"
              >
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
              aria-label="Close"
              data-ph-capture-attribute-button="forge-card-modal-close"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 sm:mt-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name or symbol"
              variant="compact"
              showIcon={false}
              className="w-full sm:max-w-sm"
              dataPhCaptureAttributeButton="forge-card-search"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-6 pb-8" style={{ minHeight: "240px" }}>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-elevated)] rounded-xl animate-pulse"
                  style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm text-center px-4">
              {sameCardIdAs != null
                ? "No matching cards."
                : searchQuery
                  ? "No cards found"
                  : "No cards available"}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
              {cards.map((card) => (
                <button
                  key={card.user_card_id}
                  type="button"
                  onClick={() => {
                    onSelect(card);
                    onClose();
                  }}
                  data-ph-capture-attribute-button="forge-card-pick"
                  className="relative rounded-[10px] sm:rounded-[14px] overflow-hidden border border-[var(--border-subtle)] cursor-pointer transition-transform hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 ring-offset-[var(--surface)]"
                  style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                >
                  {card.rendered_image_url ? (
                    <Image
                      src={card.rendered_image_url}
                      alt={card.token_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 20vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-hover)] flex flex-col items-center justify-center p-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] text-center">
                        {card.token_symbol}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">{card.rarity_name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--surface)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors"
            data-ph-capture-attribute-button="forge-card-modal-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
