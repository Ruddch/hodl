"use client";

import { useMemo } from "react";
import { DropdownSelect } from "@/components/DropdownSelect";

interface EpochSelectorProps {
  epochs: string[];
  selectedEpoch: string;
  onSelect: (epoch: string) => void;
  className?: string;
}

export function EpochSelector({ epochs, selectedEpoch, onSelect, className }: EpochSelectorProps) {
  const options = useMemo(
    () =>
      epochs.map((epoch) => ({
        value: epoch,
        label: epoch.charAt(0).toUpperCase() + epoch.slice(1),
      })),
    [epochs]
  );

  return (
    <DropdownSelect
      options={options}
      value={selectedEpoch}
      onSelect={onSelect}
      className={className}
      minWidth="198px"
    />
  );
}
