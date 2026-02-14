"use client";

import type { Tournament } from "@/lib/types";
import { EpochSelector } from "./EpochSelector";
import { WeekSelector } from "./WeekSelector";

interface TournamentFiltersProps {
  isLoading: boolean;
  epochKeys: string[];
  currentEpoch: string | null;
  tournamentsInEpoch: Tournament[];
  currentTournamentId: number | null;
  onSelectEpoch: (epoch: string) => void;
  onSelectTournament: (id: number) => void;
  className?: string;
}

export function TournamentFilters({
  isLoading,
  epochKeys,
  currentEpoch,
  tournamentsInEpoch,
  currentTournamentId,
  onSelectEpoch,
  onSelectTournament,
  className = "",
}: TournamentFiltersProps) {
  if (isLoading) {
    return (
      <div className={`flex flex-col md:flex-row gap-4 md:gap-9 ${className}`}>
        <div className="h-10 w-40 bg-[var(--surface-elevated)] rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-[var(--surface-elevated)] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (epochKeys.length === 0) {
    return (
      <p className={`text-[var(--text-muted)] ${className}`}>No tournaments available</p>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row gap-4 md:gap-9 ${className}`}>
      <EpochSelector
        epochs={epochKeys}
        selectedEpoch={currentEpoch || epochKeys[0]}
        onSelect={onSelectEpoch}
      />
      <WeekSelector
        tournaments={tournamentsInEpoch}
        selectedId={currentTournamentId}
        onSelect={onSelectTournament}
      />
    </div>
  );
}
