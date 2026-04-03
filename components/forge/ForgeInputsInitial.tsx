"use client";

import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";
import { DustIcon } from "@/components/Icons";
import { FORGE_COMMON_BURN_DUST_REWARD } from "@/lib/forge";

interface ForgeInputsInitialProps {
  onOpenPicker: () => void;
}

/** Пустое состояние: подсказка + один слот выбора первой карты */
export function ForgeInputsInitial({ onOpenPicker }: ForgeInputsInitialProps) {
  return (
    <>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
        Burn common cards in the forge. You earn{" "}
        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
          {FORGE_COMMON_BURN_DUST_REWARD}
        </span>{" "}
        <DustIcon className="inline-block h-[1em] w-[1em] align-[-0.15em] mx-0.5 text-[var(--text-primary)]" aria-hidden />
        for each common card you burn.
      </p>

      <div className="border-t border-[var(--border-subtle)] pt-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] mb-4">Inputs</p>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-4 sm:gap-x-2">
          <ForgeSlotBox filled={null} emptyLabel="Slot 1" onOpenPicker={onOpenPicker} clearLabel="Clear forge" />
        </div>
      </div>
    </>
  );
}
