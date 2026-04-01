"use client";

import Image from "next/image";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import type { UserCard } from "@/lib/types";

interface ForgeSlotBoxProps {
  filled: UserCard | null;
  emptyLabel: string;
  onOpenPicker: () => void;
  /** Только когда карта выбрана (крестик сброса слота) */
  onClear?: () => void;
  clearLabel: string;
  /** Карта выбрана, но показываем UI пустого слота — например во время burn под WebGL */
  visualEmpty?: boolean;
}

export function ForgeSlotBox({
  filled,
  emptyLabel,
  onOpenPicker,
  onClear,
  clearLabel,
  visualEmpty = false,
}: ForgeSlotBoxProps) {
  const showFilledChrome = Boolean(filled) && !visualEmpty;

  return (
    <div
      className="relative w-[148px] sm:w-[168px] shrink-0"
      style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
    >
      {showFilledChrome ? (
        <>
          <button
            type="button"
            onClick={onOpenPicker}
            className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--badge-purple-muted)] text-left cursor-pointer hover:ring-2 hover:ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)] transition-all"
            aria-label="Change card"
            data-ph-capture-attribute-button="forge-change-card"
          >
            <div className="relative w-full h-full">
              {filled!.rendered_image_url ? (
                <Image
                  src={filled!.rendered_image_url}
                  alt={filled!.token_name}
                  fill
                  className="object-cover"
                  sizes="168px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-hover)]">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{filled!.token_name}</span>
                  <span className="text-xs text-[var(--text-muted)] mt-1">{filled!.token_symbol}</span>
                </div>
              )}
            </div>
          </button>
          {onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[var(--surface)] border border-[var(--border)] rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors shadow-sm z-10"
              aria-label={clearLabel}
              data-ph-capture-attribute-button="forge-clear-card"
            >
              <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className="absolute inset-0 w-full h-full rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--badge-purple-muted)]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)] transition-colors cursor-pointer"
          data-ph-capture-attribute-button="forge-open-card-picker"
        >
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] sm:text-[11px] font-medium px-1 text-center leading-tight">{emptyLabel}</span>
        </button>
      )}
    </div>
  );
}
