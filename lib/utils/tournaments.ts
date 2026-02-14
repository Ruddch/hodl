import type { Tournament } from "@/lib/types";

/** Группировка турниров по эпохам (месяцам) */
export function groupTournamentsByEpoch(tournaments: Tournament[]): Record<string, Tournament[]> {
  const epochs: Record<string, Tournament[]> = {};

  tournaments.forEach((t) => {
    const date = new Date(t.start_date);
    const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" });
    const key = `${monthYear}`;

    if (!epochs[key]) {
      epochs[key] = [];
    }
    epochs[key].push(t);
  });

  Object.keys(epochs).forEach((key) => {
    epochs[key].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  });

  return epochs;
}

/** Ключи эпох, отсортированные от новых к старым */
export function getSortedEpochKeys(epochs: Record<string, Tournament[]>): string[] {
  const keys = Object.keys(epochs);
  if (!keys.length) return [];

  return keys.sort((a, b) => {
    const getEpochDate = (epochKey: string) => {
      const tournamentsInEpoch = epochs[epochKey] || [];
      if (!tournamentsInEpoch.length) return 0;
      return Math.max(...tournamentsInEpoch.map((t) => new Date(t.start_date).getTime()));
    };
    return getEpochDate(b) - getEpochDate(a);
  });
}
