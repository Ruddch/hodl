"use client";

import { useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useVirtualizer, measureElement } from "@tanstack/react-virtual";
import { BlurCard } from "@/components/BlurCard";
import { SignInButton } from "@/components/SignInButton";
import { useAuth } from "@/lib/auth-context";
import { useJoinPvp, useMyPvpMatchesInfinite } from "@/lib/api";
import { MatchHistoryRow } from "./MatchHistoryRow";

interface ArcadeLandingProps {
  onPlay: (matchId: number) => void;
  onViewMatch: (matchId: number) => void;
}

export function ArcadeLanding({ onPlay, onViewMatch }: ArcadeLandingProps) {
  const { isAuthenticated } = useAuth();
  const joinMutation = useJoinPvp();
  const {
    data: matchesData,
    isLoading: isMatchesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMatches,
  } = useMyPvpMatchesInfinite();

  useEffect(() => {
    refetchMatches();
  }, [refetchMatches]);

  const allMatches = useMemo(
    () => matchesData?.pages.flatMap((p) => p.items) ?? [],
    [matchesData],
  );

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: allMatches.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 64,
    measureElement,
    overscan: 5,
  });

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const sentinel = sentinelRef.current;
    const scrollParent = listRef.current;
    if (!sentinel || !scrollParent) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) fetchNextPage(); },
      { root: scrollParent, rootMargin: "80px", threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePlay = async () => {
    try {
      const result = await joinMutation.mutateAsync();
      onPlay(result.match_id);
    } catch {
      // error shown via joinMutation.isError
    }
  };

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard
        backgroundColor="rgba(167, 139, 250, 1)"
        className="flex flex-col flex-1 min-h-0"
        bgLayerWidthPercent={70}
        bgLayerHeightPercent={60}
        bgLayerAlignX="right"
        bgLayerAlignY="top"
        blurValue={120}
      >
        <div className="relative flex flex-row min-h-0 flex-1">
        {/* Background image — right side, behind content */}
        <div className="hidden md:block absolute top-[0] right-[0] w-[70%] h-[60%] pointer-events-none">
          <Image
            src="/arcade2.png"
            alt=""
            fill
            className="object-contain object-right-top"
            priority
          />
        </div>

        {/* Left: content */}
        <div className="flex flex-col gap-6 px-4 sm:px-6 pt-4 md:pt-6 pb-6 md:pb-8 flex-1 min-w-0 relative z-10">
          {/* Hero */}
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-purple-400 font-semibold">Arcade</p>
            <h2
              className="text-5xl md:text-6xl text-[var(--text-primary)] tracking-wide uppercase leading-none"
              style={{ fontFamily: "var(--font-league-gothic), sans-serif" }}
            >
              Token Duel
            </h2>
            <p className="text-[var(--text-secondary)] mt-1 text-sm md:text-base">
              Pick 5 tokens. Outplay your opponent slot by slot.
            </p>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-elevated)]">
              <span className="text-base">⚔️</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">Async PvP</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-elevated)]">
              <span className="text-base">🎴</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">5 slots · 5 picks</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface-elevated)]">
              <span className="text-base">⚡</span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">30–60 sec</span>
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]">
            <p>· Each round offers 5 random tokens with weights 1–10</p>
            <p>· Total weight of your set cannot exceed 28</p>
            <p>· Higher weight wins the slot — most slots wins the match</p>
            <p>· Tie on 2.5 vs 2.5 is decided by coin flip</p>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={handlePlay}
                disabled={joinMutation.isPending}
                className="w-full sm:w-fit px-10 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-[15px] transition-colors text-base"
              >
                {joinMutation.isPending ? "Joining…" : "Play Now"}
              </button>
            ) : (
              <div className="w-full sm:w-fit">
                <SignInButton variant="tournament" />
              </div>
            )}
            {joinMutation.isError && (
              <p className="text-sm text-red-500">Failed to join. Please try again.</p>
            )}
          </div>

          {/* Match history */}
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider shrink-0">
              My Matches
            </h3>

            {!isAuthenticated ? (
              <p className="text-sm text-[var(--text-muted)]">Sign in to see your match history.</p>
            ) : isMatchesLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-[var(--surface-elevated)] animate-pulse" />
                ))}
              </div>
            ) : allMatches.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No matches yet. Play your first game!</p>
            ) : (
              <div
                ref={listRef}
                className="overflow-y-auto flex-1 min-h-0"
                style={{ contain: "strict" }}
              >
                {/* Virtual list container */}
                <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const match = allMatches[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                          paddingBottom: 8,
                        }}
                      >
                        <MatchHistoryRow
                          match={match}
                          onClick={() => onViewMatch(match.match_id)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Sentinel for infinite scroll */}
                {hasNextPage && (
                  <div ref={sentinelRef} className="flex justify-center py-3 min-h-[48px]">
                    {isFetchingNextPage && (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        </div>
      </BlurCard>
    </div>
  );
}
