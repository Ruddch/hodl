"use client";

import { ForgeSlotBox } from "@/components/forge/ForgeSlotBox";

interface ForgeInputsInitialProps {
  onOpenPicker: () => void;
}

/** Пустое состояние: подсказка + один слот выбора первой карты */
export function ForgeInputsInitial({ onOpenPicker }: ForgeInputsInitialProps) {
  return (
    <>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
        Placeholder hint text. Rules for common vs rare slots will be explained here.
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
