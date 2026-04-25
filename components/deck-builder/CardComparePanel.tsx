"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCardDetails, getCardTournamentStats } from "@/lib/api";
import type { UserCard, CardTournamentStatsResponse } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";

// ── Format utilities ─────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1_000) return Math.round(price).toLocaleString("en-US");
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return parseFloat(price.toPrecision(4)).toString();
}

function formatMarketCap(mc: number): string {
  if (mc >= 1_000_000_000) return `$${Math.round(mc / 1_000_000_000)}B`;
  if (mc >= 1_000_000) return `$${Math.round(mc / 1_000_000)}M`;
  if (mc >= 1_000) return `$${Math.round(mc / 1_000)}K`;
  return `$${Math.round(mc)}`;
}

function formatWeekLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const weekNum = Math.ceil((d.getDate() + firstDay.getDay()) / 7);
    return `${month} W${weekNum}`;
  } catch {
    return dateStr.slice(0, 10);
  }
}

// ── Chart data merging (N series) ───────────────────────────────────────────

type ChartMode = "price" | "score" | "weight";

/** Строка графика: подпись оси X + значения серий `v0`, `v1`, … */
interface ChartRow {
  name: string;
  [key: string]: string | number | undefined;
}

function dataKeyForSeries(i: number): string {
  return `v${i}`;
}

function buildMergedChartDataMulti(
  mode: ChartMode,
  statsList: (CardTournamentStatsResponse | undefined)[],
): ChartRow[] {
  const n = statsList.length;
  if (n === 0) return [];

  if (mode === "price") {
    const map = new Map<string, ChartRow>();
    statsList.forEach((stats, i) => {
      const dk = dataKeyForSeries(i);
      for (const p of stats?.data?.prices ?? []) {
        const row = map.get(p.date) ?? { name: formatWeekLabel(p.date) };
        row[dk] = p.price;
        map.set(p.date, row);
      }
    });
    return [...map.entries()]
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([, v]) => v);
  }

  if (mode === "score") {
    const map = new Map<number, ChartRow>();
    statsList.forEach((stats, i) => {
      const dk = dataKeyForSeries(i);
      for (const s of stats?.data?.scores ?? []) {
        const row = map.get(s.tournament_number) ?? { name: `T${s.tournament_number}` };
        row[dk] = s.final_score;
        map.set(s.tournament_number, row);
      }
    });
    return [...map.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
  }

  const map = new Map<number, ChartRow>();
  statsList.forEach((stats, i) => {
    const dk = dataKeyForSeries(i);
    for (const w of stats?.data?.weights ?? []) {
      if (w.weight == null) continue;
      const row = map.get(w.tournament_number) ?? { name: `T${w.tournament_number}` };
      row[dk] = w.weight as number;
      map.set(w.tournament_number, row);
    }
  });
  return [...map.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
}

// ── Rarity colors ─────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  legendary: "rgb(255, 195, 110)",
  epic: "rgb(175, 145, 205)",
  rare: "rgb(105, 176, 237)",
  common: "rgb(200, 210, 220)",
};

const COMPARE_LINE_COLORS = [
  "var(--primary)",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#78716c",
  "#3b82f6",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
] as const;

function compareLineColor(index: number): string {
  return COMPARE_LINE_COLORS[index % COMPARE_LINE_COLORS.length];
}

const STRIP_GAP_PX = 12;

/** При ≥3 карт в полосе: слот чуть уже половины вьюпорта, справа виден край следующей — намёк на горизонтальный скролл */
const STRIP_NEXT_CARD_PEEK_PX = 10;

/** Моб. build-deck: одна панель из табов страницы — только полоса карточек или только график */
export type CardCompareMobileSection = "stats" | "chart";

// ── Card info cell ────────────────────────────────────────────────────────────

interface CardInfoCellProps {
  card: UserCard;
  colorIndex: number;
  /** Фикс. ширина полосы на десктопе; на моб. сетке не задаём — ячейка тянется на колонку */
  columnWidthPx?: number;
  isInDeck: boolean;
  canAddToDeck: boolean;
  onAddToDeck: () => void;
  onRemoveFromDeck: () => void;
  onUnpin: () => void;
}

function CardInfoCell({
  card,
  colorIndex,
  columnWidthPx,
  isInDeck,
  canAddToDeck,
  onAddToDeck,
  onRemoveFromDeck,
  onUnpin,
}: CardInfoCellProps) {
  const { data: details } = useCardDetails(card.card_id);
  const accentColor = compareLineColor(colorIndex);
  const rarityColor =
    RARITY_COLORS[details?.rarity_name?.trim().toLowerCase() ?? ""] ?? null;

  return (
    <div
      className={`flex flex-col gap-3 min-w-0 ${columnWidthPx != null ? "flex-shrink-0" : "w-full"}`}
      style={columnWidthPx != null ? { width: columnWidthPx } : undefined}
    >
      <div
        className="h-0.5 w-full rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Превью фиксированной ширины (~как раньше); внутри — правильное соотношение сторон без обрезки */}
      <div className="flex gap-3">
        <div
          className="flex-shrink-0 w-[72px] rounded-lg overflow-hidden  flex items-start justify-center"
          style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
        >
          {card.rendered_image_url ? (
            <img
              src={card.rendered_image_url}
              alt={card.token_name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] text-[var(--text-muted)]">{card.token_symbol}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0 gap-1 text-[13px]">
          <div className="font-semibold text-[var(--text-primary)] truncate">{card.token_name}</div>

          {rarityColor ? (
            <span
              className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[11px] font-semibold capitalize"
              style={{
                color: rarityColor,
                border: `1px solid ${rarityColor}`,
                backgroundColor: `color-mix(in srgb, ${rarityColor} 15%, transparent)`,
              }}
            >
              {details?.rarity_name ?? card.rarity_name}
            </span>
          ) : null}

          <div className="flex justify-between gap-2 text-[var(--text-secondary)]">
            <span>Weight</span>
            <span className="text-[var(--text-primary)] font-medium tabular-nums">{card.token_weight}</span>
          </div>
          <div className="flex justify-between gap-2 text-[var(--text-secondary)]">
            <span>Price</span>
            <span className="text-[var(--text-primary)] font-medium text-right tabular-nums">
              {details?.current_price != null ? `$${formatPrice(details.current_price)}` : "—"}
            </span>
          </div>
          <div className="flex justify-between gap-2 text-[var(--text-secondary)] min-w-0">
            <span className="shrink-0">MCap</span>
            <span className="text-[var(--text-primary)] font-medium text-right text-[12px] tabular-nums min-w-0 truncate">
              {details?.market_cap != null ? formatMarketCap(details.market_cap) : "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 min-w-0">
        <button
          type="button"
          onClick={onUnpin}
          className="flex-1 min-w-0 py-1.5 text-[12px] sm:text-[13px] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
        >
          Remove
        </button>
        {isInDeck ? (
          <button
            type="button"
            onClick={onRemoveFromDeck}
            className="flex-1 min-w-0 py-1.5 text-[12px] sm:text-[13px] border rounded-lg font-medium transition-colors whitespace-nowrap"
            style={{
              borderColor: accentColor,
              color: accentColor,
              backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`,
            }}
          >
            ✓ In deck
          </button>
        ) : (
          <button
            type="button"
            onClick={onAddToDeck}
            disabled={!canAddToDeck}
            className="flex-1 min-w-0 py-1.5 text-[11px] sm:text-[13px] border rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap px-1 sm:px-2"
            style={
              canAddToDeck
                ? {
                    borderColor: accentColor,
                    color: "white",
                    backgroundColor: accentColor,
                  }
                : undefined
            }
          >
            + Add to deck
          </button>
        )}
      </div>
    </div>
  );
}

// ── Shared compare chart ──────────────────────────────────────────────────────

interface ChartSeriesMeta {
  dataKey: string;
  name: string;
  color: string;
}

interface CompareChartProps {
  mode: ChartMode;
  data: ChartRow[];
  series: ChartSeriesMeta[];
}

function CompareChart({ mode, data, series }: CompareChartProps) {
  const formatValue = (v: number) =>
    mode === "price" ? `$${formatPrice(v)}` : String(v);

  const nameByDataKey = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of series) m.set(s.dataKey, s.name);
    return m;
  }, [series]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
        No {mode} data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="0" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          dy={4}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
          width={48}
          domain={mode === "score" ? [0, 1000] : mode === "weight" ? [0, 10] : ["auto", "auto"]}
          tickFormatter={formatValue}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
          labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
          formatter={(val: number | undefined, key: string | undefined) => {
            const label = (key && nameByDataKey.get(key)) || key || "";
            const display =
              val == null
                ? "—"
                : mode === "price"
                  ? `$${formatPrice(val)}`
                  : val.toLocaleString();
            return [display, label];
          }}
        />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ fill: "var(--surface)", stroke: s.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface CardComparePanelProps {
  pinnedCards: UserCard[];
  deckCardIds: Set<number>;
  weightLimit: number;
  currentWeight: number;
  onAddToDeck: (card: UserCard) => void;
  onRemoveFromDeck: (card: UserCard) => void;
  onUnpin: (card: UserCard) => void;
  /** Только моб. build-deck: фрагмент панели под общие табы My cards / Stat / Chart */
  mobileSection?: CardCompareMobileSection;
}

export function CardComparePanel({
  pinnedCards,
  deckCardIds,
  weightLimit,
  currentWeight,
  onAddToDeck,
  onRemoveFromDeck,
  onUnpin,
  mobileSection,
}: CardComparePanelProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("score");

  const stripViewportRef = useRef<HTMLDivElement>(null);
  const [stripViewportWidth, setStripViewportWidth] = useState(320);
  const [slotWidthPx, setSlotWidthPx] = useState(168);

  useLayoutEffect(() => {
    const el = stripViewportRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setStripViewportWidth(w);
      if (pinnedCards.length >= 3) {
        /* Левый край 3-й карты = 2*slot + 2*gap; w - (2*slot + 2*gap) = видимый край следующей */
        setSlotWidthPx(
          Math.max(140, (w - STRIP_NEXT_CARD_PEEK_PX - 2 * STRIP_GAP_PX) / 2),
        );
      } else {
        /* Две карты без «хвоста»: 2*slot + gap = w */
        setSlotWidthPx(Math.max(140, (w - STRIP_GAP_PX) / 2));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pinnedCards.length]);

  const statsQueries = useQueries({
    queries: pinnedCards.map((c) => ({
      queryKey: ["cardTournamentStats", c.card_id, {}] as const,
      queryFn: () => getCardTournamentStats(c.card_id, {}),
      enabled: !!c.card_id,
    })),
  });

  const chartData = useMemo(
    () =>
      buildMergedChartDataMulti(
        chartMode,
        statsQueries.map((q) => q.data) as (CardTournamentStatsResponse | undefined)[],
      ),
    [chartMode, statsQueries],
  );

  const chartSeries = useMemo(
    () =>
      pinnedCards.map((c, i) => ({
        dataKey: dataKeyForSeries(i),
        name: c.token_name,
        color: compareLineColor(i),
      })),
    [pinnedCards],
  );

  if (pinnedCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-4 text-center">
        <svg
          className="w-12 h-12 text-[var(--text-muted)] opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Click the chart icon on any card to see its statistics and compare with another
        </p>
      </div>
    );
  }

  const stripInnerWidth =
    pinnedCards.length * slotWidthPx + Math.max(0, pinnedCards.length - 1) * STRIP_GAP_PX;

  const cardsStrip = (
    <div
      ref={stripViewportRef}
      className="w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1"
    >
      <div
        className="flex flex-row flex-nowrap"
        style={{ gap: STRIP_GAP_PX, width: Math.max(stripViewportWidth, stripInnerWidth) }}
      >
        {pinnedCards.map((card, index) => {
          const canAdd =
            !deckCardIds.has(card.user_card_id) &&
            currentWeight + card.token_weight <= weightLimit;
          return (
            <CardInfoCell
              key={card.user_card_id}
              card={card}
              colorIndex={index}
              columnWidthPx={slotWidthPx}
              isInDeck={deckCardIds.has(card.user_card_id)}
              canAddToDeck={canAdd}
              onAddToDeck={() => onAddToDeck(card)}
              onRemoveFromDeck={() => onRemoveFromDeck(card)}
              onUnpin={() => onUnpin(card)}
            />
          );
        })}
      </div>
    </div>
  );

  /** Моб. вкладка Stat: сетка 2 колонки, строки по мере числа карт (без горизонтального скролла) */
  const statsGridMobile = (
    <div className="grid w-full grid-cols-2 gap-3">
      {pinnedCards.map((card, index) => {
        const canAdd =
          !deckCardIds.has(card.user_card_id) &&
          currentWeight + card.token_weight <= weightLimit;
        return (
          <CardInfoCell
            key={card.user_card_id}
            card={card}
            colorIndex={index}
            isInDeck={deckCardIds.has(card.user_card_id)}
            canAddToDeck={canAdd}
            onAddToDeck={() => onAddToDeck(card)}
            onRemoveFromDeck={() => onRemoveFromDeck(card)}
            onUnpin={() => onUnpin(card)}
          />
        );
      })}
    </div>
  );

  const chartModeTabs = (
    <div className="flex gap-[1px] rounded-[10px] p-[2px] w-fit flex-shrink-0 bg-[var(--input-bg)]">
      {(["price", "score", "weight"] as ChartMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setChartMode(m)}
          className={`px-3 py-2 rounded-[8px] text-[13px] font-normal capitalize transition-colors ${
            chartMode === m
              ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  const chartLegend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--text-secondary)]">
      {pinnedCards.map((c, i) => (
        <span key={c.user_card_id} className="flex items-center gap-1.5 min-w-0 max-w-full">
          <span
            className="inline-block w-6 h-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: compareLineColor(i) }}
          />
          <span className="truncate">{c.token_name}</span>
        </span>
      ))}
    </div>
  );

  if (mobileSection === "stats") {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 pb-32">
        {statsGridMobile}
      </div>
    );
  }

  if (mobileSection === "chart") {
    /* flex-1 + min-h-0: график на всю высоту между табами страницы и футером; pb — превью колоды вылезает absolute вверх */
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-3 px-4 pb-32 pt-2">
        <div className="flex-shrink-0">{chartModeTabs}</div>
        <div className="flex-shrink-0">{chartLegend}</div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col basis-0">
          <div className="relative h-full min-h-0 min-w-0 flex-1 basis-0">
            <CompareChart mode={chartMode} data={chartData} series={chartSeries} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 h-full flex-col gap-4 overflow-y-auto p-4">
      {cardsStrip}
      {chartModeTabs}
      {chartLegend}
      <div className="w-full flex-1 min-h-[200px] md:min-h-0">
        <CompareChart mode={chartMode} data={chartData} series={chartSeries} />
      </div>
    </div>
  );
}
