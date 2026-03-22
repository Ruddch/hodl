"use client";

import { useState, useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { useCardDetails, useCardTournamentStats } from "@/lib/api";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import { BlurCard } from "@/components/BlurCard";

interface CardStatsModalProps {
  open: boolean;
  onClose: () => void;
  cardId: number | null;
  cardImageUrl?: string | null;
  cardName?: string;
  cardRarity?: string;
}

function formatPrice(price: number): string {
  if (price >= 1_000) return Math.round(price).toLocaleString("en-US");
  if (price >= 1) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  // < 0.01: первые 4 значащих цифры (например 0.002045231231 -> 0.002045)
  return parseFloat(price.toPrecision(4)).toString();
}

/** Одна длина для всех подписей оси цены — фиксированное кол-во знаков после запятой */
function formatPriceForAxis(price: number, domainMax: number): string {
  const decimals = domainMax >= 1_000 ? 0 : domainMax >= 1 ? 2 : domainMax >= 0.01 ? 3 : 4;
  return price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    const value = marketCap / 1_000_000_000;
    return `$${Math.round(value)}B`;
  }
  if (marketCap >= 1_000_000) {
    const value = marketCap / 1_000_000;
    return `$${Math.round(value)}M`;
  }
  if (marketCap >= 1_000) {
    const value = marketCap / 1_000;
    return `$${Math.round(value)}K`;
  }
  return `$${Math.round(marketCap)}`;
}

/**
 * Вычисляет domain и тики для оси цены:
 * - min = ближайший дефолтный тик вниз от минимума данных
 * - max = ближайший дефолтный тик вверх от максимума данных
 * - тики равномерно распределены с "красивым" шагом
 */
function getPriceAxisConfig(values: number[]): { domain: [number, number]; ticks: number[] } | null {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range <= 0) return { domain: [min, max], ticks: [min, max] };

  // "Красивый" шаг: 1, 2, 5 × 10^n
  const roughStep = range / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  const stepMult = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  let step = stepMult * magnitude;

  // Округляем step под форматирование
  const roundStep = (s: number) =>
    max >= 1_000 ? Math.max(1, Math.round(s)) : max >= 1 ? Math.round(s * 100) / 100 : max >= 0.01 ? Math.round(s * 10000) / 10000 : parseFloat(s.toPrecision(4));
  step = roundStep(step);
  if (step <= 0) step = magnitude;

  const minDomain = roundStep(Math.floor(min / step) * step);
  const maxDomain = roundStep(Math.ceil(max / step) * step);
  // Если minDomain >= maxDomain (данные в узком диапазоне), расширяем
  const finalMin = minDomain < maxDomain ? minDomain : roundStep(minDomain - step);
  const finalMax = maxDomain > minDomain ? maxDomain : roundStep(maxDomain + step);

  const ticks: number[] = [];
  for (let t = finalMin; t <= finalMax + step * 0.001; t = roundStep(t + step)) {
    ticks.push(t);
    if (ticks.length > 15) break;
  }
  if (ticks.length < 2) ticks.push(finalMax);

  return { domain: [finalMin, finalMax], ticks };
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

type ChartMode = "price" | "score" | "weight";

function StatChart({
  mode,
  prices,
  scores,
  weights,
}: {
  mode: ChartMode;
  prices: { date: string; price: number }[];
  scores: { tournament_number: number; final_score: number }[];
  weights: { tournament_number: number; weight: number | null }[];
}) {
  const chartData = useMemo(() => {
    if (mode === "price") {
      const sorted = [...prices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sorted.map((p) => ({
        name: formatWeekLabel(p.date),
        value: p.price,
        sortKey: p.date,
      }));
    }
    if (mode === "weight") {
      const sorted = [...weights].sort((a, b) => a.tournament_number - b.tournament_number);
      return sorted
        .filter((w) => w.weight != null)
        .map((w) => ({
          name: `Tourney\n${w.tournament_number}`,
          value: w.weight as number,
          sortKey: w.tournament_number,
        }));
    }
    const sorted = [...scores].sort((a, b) => a.tournament_number - b.tournament_number);
    return sorted.map((s) => ({
      name: `Tourney\n${s.tournament_number}`,
      value: s.final_score,
      sortKey: s.tournament_number,
    }));
  }, [mode, prices, scores, weights]);

  const formatValue = (v: number) => (mode === "price" ? formatPrice(v) : String(v));
  const tooltipLabel = mode === "price" ? "Price" : mode === "weight" ? "Weight" : "Score";

  const priceAxisConfig = useMemo(() => {
    if (mode !== "price" || chartData.length === 0) return null;
    const values = chartData.map((d) => d.value);
    return getPriceAxisConfig(values);
  }, [mode, chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-[120px] text-[var(--text-muted)] text-sm">
        No {mode} data
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[120px] outline-none [&_*]:outline-none">
        <ResponsiveContainer width="100%" height="100%" minHeight={320}>
        <ComposedChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="0" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            padding={{ left: 30, right: 30, }}
            tick={(props: { x?: number | string; y?: number | string; payload?: { value?: string } }) => {
              const { x = 0, y = 0, payload } = props;
              const value = payload?.value ?? "";
              const lines = value.split("\n");
              return (
                <g transform={`translate(${Number(x)},${Number(y)})`}>
                  <text
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize={12}
                    fontWeight={400}
                  >
                    {lines.map((line, i) => (
                      <tspan key={i} x={0} dy={i === 0 ? 14 : 16}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            }}
            dy={8}
          />
          <YAxis
            dataKey="value"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--text-primary)", fontSize: 14, textAnchor: "end", fontWeight: 400 }}
            width={55}
            tickFormatter={(v) =>
              mode === "price" && priceAxisConfig
                ? formatPriceForAxis(v, priceAxisConfig.domain[1])
                : formatValue(v)
            }
            domain={
              mode === "score" ? [0, 1000] : mode === "weight" ? [0, 10] : priceAxisConfig?.domain
            }
            ticks={
              mode === "weight" ? [0, 2, 4, 6, 8, 10] : priceAxisConfig?.ticks
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              boxShadow: "var(--modal-shadow)",
            }}
            labelStyle={{ color: "var(--text-muted)", fontWeight: 600 }}
            formatter={(val: number | undefined) =>
              [val != null ? (mode === "price" ? formatPrice(val) : val.toLocaleString()) : "—", tooltipLabel]
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ fill: "var(--surface)", stroke: "var(--primary)", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CardStatsModal({
  open,
  onClose,
  cardId,
  cardImageUrl,
  cardName,
}: CardStatsModalProps) {
  const [chartMode, setChartMode] = useState<ChartMode>("score");
  const { data: cardDetails, isLoading: cardLoading, error: cardError } = useCardDetails(cardId ?? undefined);
  const { data: stats, isLoading: statsLoading, error: statsError } = useCardTournamentStats(cardId ?? undefined);

  const isLoading = cardLoading || statsLoading;
  const error = cardError || statsError;

  // Текущая стата карты — из GET /api/cards/{card_id}
  const currentPrice = cardDetails?.current_price;
  const currentWeight = cardDetails?.token_weight;
  const calculatedScore = cardDetails?.calculated_score;
  const marketCap = cardDetails?.market_cap;
  const rarityName = cardDetails?.rarity_name;
  const rarityColor = cardDetails?.rarity_color;
  const displayImage = cardDetails?.rendered_image_url ?? cardImageUrl;
  const displayName = cardDetails?.token_name ?? cardName;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      />

      <div
        className="relative bg-[var(--surface)] w-full max-w-[920px] max-h-[90vh] overflow-hidden mx-4 rounded-[30px] border border-[var(--border-subtle)]"
        onClick={(e) => e.stopPropagation()}
      >
        <BlurCard
          blurValue={110}
          backgroundColor={
            chartMode === "price"
              ? "rgba(78, 106, 255, 1)"
              : chartMode === "weight"
                ? "rgb(104, 247, 232)"
                : "rgba(220, 255, 163, 1)"
          }
        >
          <div className="relative max-h-[90vh] flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 shrink-0 p-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label="Close"
              data-ph-capture-attribute-button="card-stats-modal-close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col sm:flex-row min-h-[400px] p-6 gap-10">
                {/* Left skeleton: card + stats */}
                <div className="flex-shrink-0 w-full sm:w-[230px] flex flex-row sm:flex-col items-end sm:items-start gap-3 sm:gap-0 sm:items-center">
                  <div
                    className="rounded-[14px] shrink-0 w-[45%] sm:w-full sm:mb-4 bg-[var(--surface-hover)] animate-pulse"
                    style={{
                      aspectRatio: CARD_ASPECT_RATIO,
                      boxShadow:
                        "0px 24px 48px -12px rgba(64,65,78,0.15), 0px 12px 24px -8px rgba(64,65,78,0.1)",
                    }}
                  />
                  <div className="flex flex-col flex-1 min-w-0 sm:w-full gap-5 sm:gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between items-center gap-2">
                        <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
                        <div className="h-4 w-16 bg-[var(--surface-hover)] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right skeleton: tabs + chart */}
                <div className="flex-1 flex flex-col min-w-0 min-h-[320px] sm:min-h-0">
                  <div className="flex gap-[1px] rounded-[10px] p-[2px] w-fit mb-4 flex-shrink-0" style={{ backgroundColor: "var(--input-bg)" }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-16 sm:w-20 bg-[var(--surface-hover)] rounded-[10px] animate-pulse" />
                    ))}
                  </div>
                  <div className="flex-1 min-h-[320px] sm:min-h-0 rounded-xl bg-[var(--surface-hover)] animate-pulse" />
                </div>
              </div>
            ) : error ? (
              <div className="p-12 px-6 text-center text-red-500">
                {error instanceof Error ? error.message : "Failed to load statistics"}
              </div>
            ) : (stats || cardDetails) ? (
              <div className="flex flex-col sm:flex-row min-h-[400px] p-6 gap-10">
                {/* Left: Card info — на мобилке: маленькая карта слева, стата справа */}
                <div className="flex-shrink-0 w-full sm:w-[230px] flex flex-row sm:flex-col items-end sm:items-start gap-3 sm:gap-0 sm:items-center">
                  {displayImage && (
                    <div
                      className="relative rounded-[14px] overflow-hidden shrink-0 w-[45%] sm:w-full sm:mb-4"
                      style={{
                        aspectRatio: CARD_ASPECT_RATIO,
                        boxShadow:
                          "0px 24px 48px -12px rgba(64,65,78,0.15), 0px 12px 24px -8px rgba(64,65,78,0.1)",
                      }}
                    >
                      <img
                        src={displayImage}
                        alt={displayName ?? "Card"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0 sm:w-full text-[14px] sm:text-[14px] leading-7 sm:leading-8 font-normal">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Rarity</span>
                      <span
                        className="text-right font-medium"
                        style={{ color: rarityColor ?? "inherit" }}
                      >
                        {rarityName ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Score</span>
                      <span className="text-[var(--text-primary)] text-right">{calculatedScore != null ? calculatedScore.toLocaleString() : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Current price</span>
                      <span className="text-[var(--text-primary)] text-right">{currentPrice != null ? formatPrice(currentPrice) : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Market cap</span>
                      <span className="text-[var(--text-primary)] text-right">{marketCap != null ? formatMarketCap(marketCap) : "—"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Weight</span>
                      <span className="text-[var(--text-primary)] text-right">{currentWeight != null ? currentWeight : "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Chart — min-h нужен, иначе в flex-col (мобилка) блок получает 0 высоты и ResponsiveContainer возвращает null */}
                <div className="flex-1 flex flex-col min-w-0 min-h-[320px] sm:min-h-0">
                  <div className="flex gap-[1px] rounded-[10px] p-[2px] w-fit mb-4 flex-shrink-0 bg-[var(--input-bg)]">
                    <button
                      onClick={() => setChartMode("price")}
                      data-ph-capture-attribute-button="card-stats-chart-price"
                      className={`p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                        chartMode === "price"
                          ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Price
                    </button>
                    <button
                      onClick={() => setChartMode("score")}
                      data-ph-capture-attribute-button="card-stats-chart-score"
                      className={`p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                        chartMode === "score"
                          ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Score
                    </button>
                    <button
                      onClick={() => setChartMode("weight")}
                      data-ph-capture-attribute-button="card-stats-chart-weight"
                      className={`p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center transition-colors ${
                        chartMode === "weight"
                          ? "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Weight
                    </button>
                  </div>
                  <div className="flex-1 min-h-[320px] sm:min-h-0 flex rounded-xl outline-none focus:outline-none [&_*]:outline-none [&_*]:focus:outline-none">
                    <StatChart
                      mode={chartMode}
                      prices={stats?.data?.prices ?? []}
                      scores={stats?.data?.scores ?? []}
                      weights={stats?.data?.weights ?? []}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        </BlurCard>
      </div>
    </div>
  );
}
