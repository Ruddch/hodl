"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { useTokensLeaderboardInfinite } from "@/lib/api";
import type { TokenWithRate } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { DropdownSelect } from "@/components/DropdownSelect";
import { SearchInput } from "@/components/SearchInput";

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString("en-US", { maximumFractionDigits: 4, minimumFractionDigits: 2 });
  if (price >= 0.0001) return price.toLocaleString("en-US", { maximumFractionDigits: 6, minimumFractionDigits: 4 });
  return price.toExponential(2);
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  if (cap >= 1e3) return `$${(cap / 1e3).toFixed(1)}K`;
  return `$${cap.toFixed(0)}`;
}

function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function TokenCard({ token, rank }: { token: TokenWithRate; rank: number }) {
  const currentPrice = token.current_price;
  const score = token.score;
  const isPositive = currentPrice != null && currentPrice.change_24h >= 0;

  const borderStyle =
    rank === 1
      ? { border: "2px solid #fbbf24" } // gold
      : rank === 2
        ? { border: "2px solid rgba(148, 163, 184, 0.85)" } // silver
        : rank === 3
          ? { border: "2px solid rgba(205, 127, 50, 0.39)" } // bronze
          : { border: "1px solid var(--border)" };

  return (
    <div
      className="rounded-2xl p-4 md:p-5 backdrop-blur-sm transition-colors bg-[var(--surface-elevated)]/80 hover:bg-[var(--surface-hover)]/80"
      style={borderStyle}
    >
      {/* Header: rank + avatar + name/symbol */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className="shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold"
          style={{
            color: "var(--leaderboard-position-color)",
            backgroundColor: "var(--badge-purple-muted)",
            border: "1px solid var(--leaderboard-position-border)",
          }}
        >
          #{rank}
        </span>
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden bg-[var(--surface-muted)] shrink-0">
          <Image
            src={token.image_url}
            alt={token.name}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <span className="block text-base md:text-lg font-semibold text-[var(--text-primary)] truncate">
            {token.name}
          </span>
          <span className="block text-sm text-[var(--text-muted)]">{token.symbol}</span>
        </div>
      </div>

      {/* Stats grid: Score | 24h, Price | Market Cap */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-0.5">Score</span>
          <span className="text-sm md:text-base font-medium text-[var(--text-primary)]">
            {score ? (
              <>
                {score.calculated_score.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                {score.tournament_change !== 0 && (
                  <span
                    className={`ml-1 text-xs ${
                      score.tournament_change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    ({score.tournament_change >= 0 ? "+" : ""}{score.tournament_change.toFixed(1)})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[var(--text-muted)]">—</span>
            )}
          </span>
        </div>
        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-0.5">24h</span>
          {currentPrice ? (
            <span
              className={`text-sm md:text-base font-medium ${
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatChange(currentPrice.change_24h)}
            </span>
          ) : (
            <span className="text-sm md:text-base text-[var(--text-muted)]">—</span>
          )}
        </div>
        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-0.5">Price</span>
          <span className="text-sm md:text-base font-medium text-[var(--text-primary)]">
            {currentPrice ? `$${formatPrice(currentPrice.price)}` : "—"}
          </span>
        </div>
        <div>
          <span className="block text-xs text-[var(--text-muted)] mb-0.5">Market Cap</span>
          <span className="text-sm md:text-base text-[var(--text-secondary)]">
            {currentPrice ? formatMarketCap(currentPrice.market_cap) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TokensCardsSkeleton() {
  return (
    <div className="grid pt-2 md:pt-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={`rounded-2xl bg-[var(--surface-elevated)]/80 p-4 md:p-5 backdrop-blur-sm ${
            i < 4 ? "border-2 border-[var(--border)]" : "border border-[var(--border)]"
          }`}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 mt-1 w-7 h-7 rounded-lg bg-[var(--surface-hover)] animate-pulse" />
            <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--surface-hover)] animate-pulse" />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="h-5 md:h-6 w-24 md:w-28 bg-[var(--surface-hover)] rounded animate-pulse mb-2" />
              <div className="h-4 w-14 bg-[var(--surface-hover)] rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j}>
                <div className="h-4 w-10 bg-[var(--surface-hover)] rounded animate-pulse mb-1.5" />
                <div className="h-5 md:h-[1.25rem] w-16 md:w-20 bg-[var(--surface-hover)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TokensPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"calculated_score" | "symbol">("calculated_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const parentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const apiParams = useMemo(() => ({
    is_active: true,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [sortBy, sortOrder]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTokensLeaderboardInfinite(apiParams);

  const allTokens = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.data);
  }, [data]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return allTokens;
    const q = searchQuery.toLowerCase().trim();
    return allTokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }, [allTokens, searchQuery]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const sentinel = sentinelRef.current;
    const scrollParent = parentRef.current;
    if (!sentinel || !scrollParent) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { root: scrollParent, rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgb(193, 238, 170)" className="flex-1 min-h-0 flex flex-col min-w-0">
        {/* Header + Search + Filters */}
        <div className="flex flex-col gap-4 px-4 sm:px-6 pt-4 md:pt-6 pb-0 flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)]">
            Tokens
          </h2>

          <div className="flex flex-col md:flex-row gap-4 md:gap-9 md:items-center">
            {/* Search */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by symbol or name"
              className="flex-1 md:max-w-[320px]"
              dataPhCaptureAttributeButton="search-tokens"
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 md:gap-4">
              <DropdownSelect
                options={[
                  { value: "calculated_score", label: "By score" },
                  { value: "symbol", label: "By symbol" },
                ]}
                value={sortBy}
                onSelect={(v) => setSortBy(v as "calculated_score" | "symbol")}
                minWidth="140px"
              />
              <DropdownSelect
                options={[
                  { value: "desc", label: "High → Low" },
                  { value: "asc", label: "Low → High" },
                ]}
                value={sortOrder}
                onSelect={(v) => setSortOrder(v as "asc" | "desc")}
                minWidth="120px"
              />
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="px-4 pt-2 md:px-6 pb-4 md:pb-6 min-w-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <TokensCardsSkeleton />
          ) : filteredTokens.length === 0 ? (
            <div className="py-12 pt-2 md:pt-4 text-center text-[var(--text-muted)]">
              {searchQuery ? "No tokens match your search" : "No tokens available"}
            </div>
          ) : (
            <div className="flex flex-col  flex-1 min-h-0 min-w-0 leaderboard-content-fade-in">
              <div
                ref={parentRef}
                className="flex-1 pt-2 md:pt-4 min-h-0 overflow-y-auto overflow-x-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {filteredTokens.map((token, index) => (
                    <TokenCard key={token.id} token={token} rank={index + 1} />
                  ))}
                </div>
                {hasNextPage && (
                  <div ref={sentinelRef} className="flex justify-center py-6 min-h-[80px]">
                    {isFetchingNextPage && (
                      <div className="flex gap-1">
                        <span
                          className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-[var(--primary-muted)] animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </BlurCard>
    </div>
  );
}
