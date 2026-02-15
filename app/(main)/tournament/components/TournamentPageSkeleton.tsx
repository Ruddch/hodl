"use client";

/**
 * Скелетон страницы турнира — общие блоки под карточку турнира, выбор колоды и лидерборд.
 * Высоты рассчитаны по реальным компонентам (mobile / desktop):
 * - TournamentInfoCard: py-5/10, title, stats, buttons → ~192px / ~280px
 * - Deck: mobile EmptyDeck ~520 / RegisteredDeck ~410; desktop ~480
 * - LeaderboardPreview: Empty (пьедестал) ~350px / Active (таблица 400) ~500px
 */
export function TournamentPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-[192px] sm:h-[280px] bg-[var(--surface-elevated)] rounded-[16px] animate-pulse" />
      <div className="h-[520px] sm:h-[480px] bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
      <div className="h-[350px] sm:h-[500px] bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
    </div>
  );
}
