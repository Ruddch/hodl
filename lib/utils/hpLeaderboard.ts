import type { HpLeaderboardEntry, LeaderboardEntry } from "@/lib/types";

/** Приводит запись HP-лидерборда к форме строки турнирной таблицы для общего UI (колонки задаёт variant). */
export function hpLeaderboardEntryToLeaderboardRow(e: HpLeaderboardEntry): LeaderboardEntry {
  return {
    position: e.position,
    user_id: e.user_id,
    deck_id: null,
    wallet_address: e.wallet_address,
    nickname: e.nickname,
    avatar_url: e.avatar_url,
    final_score: e.hp_balance,
    deck_composition: [],
    cards: [],
    prizes: null,
    calculated_at: "",
  };
}
