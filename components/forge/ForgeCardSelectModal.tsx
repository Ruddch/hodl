"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useMyProfile } from "@/lib/api";
import type { UserCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { SearchInput } from "@/components/SearchInput";
import { isCommonRarity } from "@/lib/forge";

// ─── Types ─────────────────────────────────────────────────────────────────────

type CardMode = "available" | "selected" | "disabled";

interface CardSlot {
  card: UserCard;
  mode: CardMode;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ForgeCardSelectModalProps {
  open: boolean;
  onClose: () => void;

  // ── Single-select mode ─────────────────────────────────────────────────────
  onSelect?: (card: UserCard) => void;

  // ── Multi-select mode ──────────────────────────────────────────────────────
  multiSelect?: boolean;
  /** IDs of already selected cards (parent-managed state) */
  multiSelectedIds?: number[];
  /** Called when user toggles a card — parent adds/removes from its state */
  onMultiToggle?: (card: UserCard) => void;
  /** Maximum number of cards that can be selected */
  maxMultiSelect?: number;
  /**
   * Called for each card in multi-select mode.
   * Return true to gray out the card (incompatible with current selection).
   * Only called when at least one card is selected (reference card exists).
   */
  multiDisabled?: (card: UserCard) => boolean;

  // ── Filters (applied as hard filters in both modes) ────────────────────────
  /** Only show cards with this card_id */
  sameCardIdAs?: number;
  /** These user_card_ids are excluded from the list (single-select only) */
  excludeUserCardIds?: number[];
  /** Only common-rarity cards */
  commonOnly?: boolean;
  walletChainId?: number;
  /** Filter by chain (single-select only — use multiDisabled for multi-select) */
  matchChainId?: number;
  /** Filter by token symbol (single-select only — use multiDisabled for multi-select) */
  matchTokenSymbol?: string;
  /** Filter by rarity name (single-select only — use multiDisabled for multi-select) */
  matchRarityName?: string;
  /** Exclude these rarity names entirely */
  excludeRarityNames?: string[];
  /** Only show cards where card_id count >= N among available cards */
  minCopiesRequired?: number;

  title?: string;
  subtitle?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ForgeCardSelectModal({
  open,
  onClose,
  onSelect,
  multiSelect = false,
  multiSelectedIds = [],
  onMultiToggle,
  maxMultiSelect,
  multiDisabled,
  sameCardIdAs,
  excludeUserCardIds = [],
  commonOnly = false,
  matchChainId,
  walletChainId,
  matchTokenSymbol,
  matchRarityName,
  excludeRarityNames,
  minCopiesRequired,
  title = "Placeholder title",
  subtitle = "Placeholder subtitle.",
}: ForgeCardSelectModalProps) {
  const { data: profile, isLoading } = useMyProfile(true, open);
  const [searchQuery, setSearchQuery] = useState("");

  const excludeSet  = useMemo(() => new Set(excludeUserCardIds), [excludeUserCardIds]);
  const selectedSet = useMemo(() => new Set(multiSelectedIds),   [multiSelectedIds]);

  // ── Multi-select: refs always hold the latest prop values ──────────────────
  // We read from these refs only at snapshot time (when modal opens).

  const multiSelectedIdsRef = useRef(multiSelectedIds);
  const multiDisabledRef    = useRef(multiDisabled);
  useEffect(() => { multiSelectedIdsRef.current = multiSelectedIds; });
  useEffect(() => { multiDisabledRef.current    = multiDisabled; });

  // ── Multi-select: frozen base list ─────────────────────────────────────────
  // Computed ONCE when the modal opens (and profile is ready).
  // Order: selected → available → disabled (based on state at open time).
  // Never changes while the modal is open — prevents re-sorting and phantom cards.

  const [multiBaseCards, setMultiBaseCards] = useState<UserCard[]>([]);
  const snapshotTakenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      // Reset so next open gets a fresh snapshot
      snapshotTakenRef.current = false;
      return;
    }
    if (!multiSelect || snapshotTakenRef.current || isLoading) return;
    if (!profile?.cards) return;

    snapshotTakenRef.current = true;

    const selectedAtOpen = new Set(multiSelectedIdsRef.current);
    const disabledFn     = multiDisabledRef.current;
    const hasSelAtOpen   = selectedAtOpen.size > 0;

    // Hard filters — same as current prop values at snapshot time
    let list = profile.cards.filter((c) => c.status === "available");
    if (sameCardIdAs != null)   list = list.filter((c) => c.card_id === sameCardIdAs);
    if (commonOnly)             list = list.filter((c) => isCommonRarity(c));
    if (excludeRarityNames?.length) {
      const ex = new Set(excludeRarityNames.map((r) => r.trim().toLowerCase()));
      list = list.filter((c) => !ex.has(c.rarity_name.trim().toLowerCase()));
    }
    if (minCopiesRequired != null && minCopiesRequired > 1) {
      const cnt = new Map<number, number>();
      for (const c of list) cnt.set(c.card_id, (cnt.get(c.card_id) ?? 0) + 1);
      list = list.filter((c) => (cnt.get(c.card_id) ?? 0) >= minCopiesRequired);
    }

    // Sort based on state AT OPEN: selected → available → disabled
    const sel: UserCard[]   = [];
    const avail: UserCard[] = [];
    const dis: UserCard[]   = [];
    for (const card of list) {
      if (selectedAtOpen.has(card.user_card_id)) {
        sel.push(card);
      } else if (hasSelAtOpen && (disabledFn?.(card) ?? false)) {
        dis.push(card);
      } else {
        avail.push(card);
      }
    }
    setMultiBaseCards([...sel, ...avail, ...dis]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, multiSelect, isLoading, profile?.cards]);
  // ^ Intentionally minimal deps: sameCardIdAs/commonOnly/etc. are captured via
  //   the closure at the time the effect fires (when open & profile are ready).
  //   multiSelectedIds / multiDisabled are read via refs to avoid re-snapshotting
  //   when the parent's selection state changes.

  // ── Multi-select: display slots (base order preserved, modes update live) ──
  // The ORDER comes from multiBaseCards (frozen). Only the mode (selected /
  // available / disabled) updates dynamically as the user toggles cards.

  const multiDisplaySlots = useMemo<CardSlot[]>(() => {
    if (!multiSelect) return [];

    let list = multiBaseCards;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) => c.token_name.toLowerCase().includes(q) || c.token_symbol.toLowerCase().includes(q),
      );
    }

    const maxReached   = maxMultiSelect != null && selectedSet.size >= maxMultiSelect;
    const hasSelection = selectedSet.size > 0;

    return list.map((card) => {
      if (selectedSet.has(card.user_card_id)) return { card, mode: "selected" as CardMode };
      const isDisabled = maxReached || (hasSelection && (multiDisabled?.(card) ?? false));
      return { card, mode: isDisabled ? ("disabled" as CardMode) : ("available" as CardMode) };
    });
  }, [multiSelect, multiBaseCards, searchQuery, selectedSet, maxMultiSelect, multiDisabled]);

  // ── Single-select: filtered card list ──────────────────────────────────────

  const singleSelectCards = useMemo(() => {
    if (multiSelect) return [];

    let list =
      profile?.cards?.filter(
        (c) => c.status === "available" && !excludeSet.has(c.user_card_id),
      ) ?? [];

    if (sameCardIdAs != null) list = list.filter((c) => c.card_id === sameCardIdAs);
    if (commonOnly) list = list.filter((c) => isCommonRarity(c));
    if (matchChainId != null)
      list = list.filter((c) => (c.chain_id ?? walletChainId) === matchChainId);
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
    if (minCopiesRequired != null && minCopiesRequired > 1) {
      const available = profile?.cards?.filter((c) => c.status === "available") ?? [];
      const countByCardId = new Map<number, number>();
      for (const c of available) {
        countByCardId.set(c.card_id, (countByCardId.get(c.card_id) ?? 0) + 1);
      }
      list = list.filter((c) => (countByCardId.get(c.card_id) ?? 0) >= minCopiesRequired);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) =>
        c.token_name.toLowerCase().includes(q) || c.token_symbol.toLowerCase().includes(q),
    );
  }, [
    profile?.cards,
    multiSelect,
    searchQuery,
    sameCardIdAs,
    excludeSet,
    commonOnly,
    matchChainId,
    walletChainId,
    matchTokenSymbol,
    matchRarityName,
    excludeRarityNames,
    minCopiesRequired,
  ]);


  // ── Side effects ───────────────────────────────────────────────────────────

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

  const selectedCount = multiSelectedIds.length;

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {/* Header */}
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

        {/* Card grid */}
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
          ) : multiSelect ? (
            /* ── Multi-select grid ─────────────────────────────────────────── */
            multiDisplaySlots.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm text-center px-4">
                {searchQuery ? "No cards found" : "No cards available"}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8">
                {multiDisplaySlots.map((slot) => {
                  const { card, mode } = slot;
                  const isSelected = mode === "selected";
                  const isDisabled = mode === "disabled";

                  return (
                    <button
                      key={card.user_card_id}
                      type="button"
                      onClick={() => !isDisabled && onMultiToggle?.(card)}
                      disabled={isDisabled}
                      data-ph-capture-attribute-button="forge-card-pick"
                      className={[
                        "relative rounded-[10px] sm:rounded-[14px] overflow-visible transition-all",
                        isSelected
                          ? "cursor-pointer ring-2 sm:ring-3 ring-[var(--primary)] ring-offset-2 sm:ring-offset-4 ring-offset-[var(--surface)]"
                          : isDisabled
                            ? "opacity-40 grayscale cursor-not-allowed"
                            : "cursor-pointer border border-[var(--border-subtle)] hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 ring-offset-[var(--surface)]",
                      ].join(" ")}
                      style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
                    >
                      {isSelected && (
                        <div className="absolute flex items-center justify-center top-0 -translate-y-[14px] sm:-translate-y-[18px] left-1/2 -translate-x-1/2 z-10 px-2 py-1 bg-[var(--primary)] rounded-[4px]">
                          <span className="text-[8px] sm:text-[9px] leading-[8px] font-semibold text-white whitespace-nowrap">
                            SELECTED
                          </span>
                        </div>
                      )}
                      <div className="w-full h-full rounded-[10px] sm:rounded-[14px] overflow-hidden">
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
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {card.rarity_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* ── Single-select grid ────────────────────────────────────────── */
            singleSelectCards.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm text-center px-4">
                {sameCardIdAs != null
                  ? "No matching cards."
                  : searchQuery
                    ? "No cards found"
                    : "No cards available"}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4">
                {singleSelectCards.map((card) => (
                  <button
                    key={card.user_card_id}
                    type="button"
                    onClick={() => {
                      onSelect?.(card);
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
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 bg-[var(--surface)]">
          {multiSelect ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-primary)]">{selectedCount}</span>
                {maxMultiSelect != null ? `\u00a0/\u00a0${maxMultiSelect}` : ""} selected
              </span>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-8 rounded-[15px] text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}
                data-ph-capture-attribute-button="forge-card-modal-done"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-hover)] transition-colors"
              data-ph-capture-attribute-button="forge-card-modal-cancel"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
