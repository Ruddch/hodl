"use client";

import { useTournaments } from "@/lib/api";
import { groupTournamentsByEpoch, getSortedEpochKeys } from "@/lib/utils/tournaments";
import type { Tournament } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useEffect, useState, useCallback } from "react";

export type TournamentSelectorStrategy = "active" | "finished";

interface UseTournamentSelectorOptions {
  /** Стратегия выбора турнира по умолчанию: active — для страницы турнира, finished — для лидерборда */
  defaultStrategy: TournamentSelectorStrategy;
}

export interface UseTournamentSelectorReturn {
  tournamentsData: { items: Tournament[] } | undefined;
  epochs: Record<string, Tournament[]>;
  epochKeys: string[];
  tournamentsInEpoch: Tournament[];
  currentEpoch: string | null;
  currentTournamentId: number | null;
  selectedTournament: Tournament | null;
  isLoading: boolean;
  refetchTournaments: () => void;
  onSelectEpoch: (epoch: string) => void;
  onSelectTournament: (id: number) => void;
}

export function useTournamentSelector(
  options: UseTournamentSelectorOptions
): UseTournamentSelectorReturn {
  const { defaultStrategy } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedEpoch, setSelectedEpoch] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: tournamentsData, isLoading: tournamentsLoading, refetch: refetchTournaments } =
    useTournaments({ limit: 50 });

  const epochs = useMemo(() => {
    if (!tournamentsData?.items.length) return {};
    return groupTournamentsByEpoch(tournamentsData.items);
  }, [tournamentsData]);

  const epochKeys = useMemo(() => getSortedEpochKeys(epochs), [epochs]);

  const defaultTournament = useMemo(() => {
    if (!tournamentsData?.items.length) return null;
    if (defaultStrategy === "finished") {
      const finished = tournamentsData.items
        .filter((t) => t.status === "finished")
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
      return finished || tournamentsData.items[0];
    }
    return null;
  }, [tournamentsData, defaultStrategy]);

  useEffect(() => {
    if (isInitialized || !epochKeys.length || !tournamentsData?.items.length) return;

    const urlEpoch = searchParams.get("epoch");
    const urlTournamentId = searchParams.get("tournamentId");

    const applyInit = () => {
      if (urlEpoch && epochKeys.includes(urlEpoch)) {
        setSelectedEpoch(urlEpoch);
        if (urlTournamentId) {
          const tournamentId = parseInt(urlTournamentId, 10);
          const tournamentsInUrlEpoch = epochs[urlEpoch] || [];
          if (tournamentsInUrlEpoch.some((t) => t.id === tournamentId)) {
            setSelectedTournamentId(tournamentId);
          }
        }
      } else if (urlTournamentId) {
        const tournamentId = parseInt(urlTournamentId, 10);
        for (const epochKey of epochKeys) {
          const tournamentsInEpoch = epochs[epochKey] || [];
          if (tournamentsInEpoch.some((t) => t.id === tournamentId)) {
            setSelectedEpoch(epochKey);
            setSelectedTournamentId(tournamentId);
            break;
          }
        }
      } else if (defaultTournament && defaultStrategy === "finished") {
        for (const epochKey of epochKeys) {
          const tournamentsInEpoch = epochs[epochKey] || [];
          if (tournamentsInEpoch.some((t) => t.id === defaultTournament.id)) {
            setSelectedEpoch(epochKey);
            setSelectedTournamentId(defaultTournament.id);
            break;
          }
        }
      }
      setIsInitialized(true);
    };

    queueMicrotask(applyInit);
  }, [epochKeys.length, searchParams, tournamentsData?.items.length, isInitialized, epochs, epochKeys, defaultTournament, defaultStrategy]);

  const currentEpoch = useMemo(() => {
    if (selectedEpoch) return selectedEpoch;
    if (!epochKeys.length) return null;

    if (defaultStrategy === "active") {
      for (const epochKey of epochKeys) {
        const tournamentsInEpoch = epochs[epochKey] || [];
        const hasActive = tournamentsInEpoch.some(
          (t) => t.status === "registration" || t.status === "ongoing"
        );
        if (hasActive) return epochKey;
      }
    } else {
      for (const epochKey of epochKeys) {
        const tournamentsInEpoch = epochs[epochKey] || [];
        const hasFinished = tournamentsInEpoch.some((t) => t.status === "finished");
        if (hasFinished) return epochKey;
      }
    }
    return epochKeys[0];
  }, [selectedEpoch, epochKeys, epochs, defaultStrategy]);

  const tournamentsInEpoch = useMemo(() => {
    return currentEpoch ? epochs[currentEpoch] || [] : [];
  }, [currentEpoch, epochs]);

  const defaultTournamentInEpoch = useMemo(() => {
    if (!tournamentsInEpoch.length) return null;
    if (defaultStrategy === "finished") {
      const finished = tournamentsInEpoch
        .filter((t) => t.status === "finished")
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0];
      return finished || tournamentsInEpoch[tournamentsInEpoch.length - 1];
    }
    const active = tournamentsInEpoch.find((t) => t.status === "registration" || t.status === "ongoing");
    return active || tournamentsInEpoch[0];
  }, [tournamentsInEpoch, defaultStrategy]);

  const currentTournamentId = selectedTournamentId ?? defaultTournamentInEpoch?.id ?? defaultTournament?.id ?? null;

  useEffect(() => {
    if (!isInitialized || !currentEpoch) return;

    const currentEpochParam = searchParams.get("epoch");
    const currentTournamentIdParam = searchParams.get("tournamentId");
    const epochChanged = currentEpochParam !== currentEpoch;
    const tournamentIdChanged = currentTournamentIdParam !== (currentTournamentId?.toString() || null);

    if (!epochChanged && !tournamentIdChanged) return;

    const params = new URLSearchParams(searchParams.toString());
    if (currentEpoch) params.set("epoch", currentEpoch);
    else params.delete("epoch");
    if (currentTournamentId) params.set("tournamentId", currentTournamentId.toString());
    else params.delete("tournamentId");

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(pathname + newUrl, { scroll: false });
  }, [currentEpoch, currentTournamentId, isInitialized, router, pathname, searchParams]);

  const selectedTournament = useMemo(() => {
    if (!currentTournamentId || !tournamentsData?.items.length) return null;
    return tournamentsData.items.find((t) => t.id === currentTournamentId) ?? null;
  }, [currentTournamentId, tournamentsData]);

  const onSelectEpoch = useCallback(
    (epoch: string) => {
      setSelectedEpoch(epoch);
      const newTournaments = epochs[epoch] || [];
      if (selectedTournamentId && !newTournaments.some((t) => t.id === selectedTournamentId)) {
        setSelectedTournamentId(null);
      }
    },
    [epochs, selectedTournamentId]
  );

  const onSelectTournament = useCallback((id: number) => {
    setSelectedTournamentId(id);
  }, []);

  return {
    tournamentsData,
    epochs,
    epochKeys,
    tournamentsInEpoch,
    currentEpoch,
    currentTournamentId,
    selectedTournament,
    isLoading: tournamentsLoading,
    refetchTournaments,
    onSelectEpoch,
    onSelectTournament,
  };
}
