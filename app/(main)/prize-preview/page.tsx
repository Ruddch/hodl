"use client";

import { PrizeRewardsDisplay } from "@/components/PrizeRewardsDisplay";
import type { PrizeInfo } from "@/lib/types";

function stubPrize(partial: Pick<PrizeInfo, "reward_name" | "amount">): PrizeInfo {
  return {
    reward_type_id: 0,
    reward_category: "mock",
    currency_type: "mock",
    ...partial,
  };
}

const MOCK: Record<string, PrizeInfo[]> = {
  hp: [stubPrize({ reward_name: "hp", amount: "12450" })],
  pack: [stubPrize({ reward_name: "pack", amount: "2" })],
  dust: [stubPrize({ reward_name: "dust", amount: "380" })],
  mixed: [
    stubPrize({ reward_name: "hp", amount: "9000" }),
    stubPrize({ reward_name: "pack", amount: "1" }),
    stubPrize({ reward_name: "dust", amount: "42" }),
  ],
  packAggregated: [
    stubPrize({ reward_name: "pack", amount: "1" }),
    stubPrize({ reward_name: "pack", amount: "2" }),
  ],
  casing: [
    stubPrize({ reward_name: "HP", amount: "100" }),
    stubPrize({ reward_name: "Pack", amount: "1" }),
    stubPrize({ reward_name: "DUST", amount: "5" }),
  ],
  other: [stubPrize({ reward_name: "credits", amount: "10" })],
};

function Section({ title, prizes }: { title: string; prizes: PrizeInfo[] }) {
  return (
    <section className="rounded-xl border border-[var(--leaderboard-row-border)] bg-[var(--surface)]/50 p-4 space-y-3">
      <h2 className="text-sm font-medium text-[var(--text-muted)]">{title}</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">size=&quot;md&quot; (таблица)</p>
          <p className="text-base font-medium text-[var(--text-primary)]">
            <PrizeRewardsDisplay prizes={prizes} size="md" />
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">size=&quot;sm&quot; (бейдж колоды)</p>
          <span className="inline-flex flex-wrap items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded text-[var(--badge-purple-text)] bg-[var(--badge-purple-bg)]">
            <PrizeRewardsDisplay prizes={prizes} size="sm" />
          </span>
        </div>
      </div>
    </section>
  );
}

export default function PrizePreviewPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Prize display (mock)</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Локальный превью наград. Удали маршрут <code className="text-xs">/prize-preview</code>, когда не нужен.
        </p>
      </div>

      <Section title="Только hp" prizes={MOCK.hp} />
      <Section title="Только pack" prizes={MOCK.pack} />
      <Section title="Только dust" prizes={MOCK.dust} />
      <Section title="hp + pack + dust" prizes={MOCK.mixed} />
      <Section title="Несколько pack (агрегация → одна строка)" prizes={MOCK.packAggregated} />
      <Section title="Разный регистр имён (HP / Pack / DUST)" prizes={MOCK.casing} />
      <Section title="Неизвестный тип (как hp: число + имя)" prizes={MOCK.other} />
    </div>
  );
}
