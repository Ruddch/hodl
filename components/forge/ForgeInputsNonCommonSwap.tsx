"use client";

import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";
import type { UserCard } from "@/lib/types";

interface ForgeInputsNonCommonSwapProps {
  card: UserCard;
  onOpenPicker: () => void;
  onClear: () => void;
}

/** Не-common: слот с картой + сообщение справа, без кнопок действий */
export function ForgeInputsNonCommonSwap({
  card,
  onOpenPicker,
  onClear,
}: ForgeInputsNonCommonSwapProps) {
  return (
    <div className="border-t border-[var(--border-subtle)] pt-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] mb-4">Inputs</p>

      <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
        <ForgeSlotBox
          filled={card}
          emptyLabel="Slot 1"
          onOpenPicker={onOpenPicker}
          onClear={onClear}
          clearLabel="Clear forge"
        />
        <div className="flex-1 min-w-0 max-w-md sm:pt-0.5">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">Currently unavailable.</p>
        </div>
      </div>
    </div>
  );
}
