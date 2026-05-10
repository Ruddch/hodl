"use client";

import { useEffect, useRef } from "react";
import { BlurCard } from "@/components/BlurCard";
import { getPvpDraftOptions } from "@/lib/api";

interface ArcadeWaitingProps {
  matchId: number;
  onDraftReady: () => void;
  onCancel: () => void;
}

export function ArcadeWaiting({ matchId, onDraftReady, onCancel }: ArcadeWaitingProps) {
  const onDraftReadyRef = useRef(onDraftReady);
  useEffect(() => {
    onDraftReadyRef.current = onDraftReady;
  }, [onDraftReady]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const options = await getPvpDraftOptions(matchId, 1);
        if (!cancelled && options?.offered_cards?.length > 0) {
          cancelled = true;
          onDraftReadyRef.current();
        }
      } catch {
        // still waiting for opponent
      }
    };

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matchId]);

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgba(167, 139, 250, 1)" className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center flex-1 gap-8 px-4 py-16">
          {/* Pulsing icon */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-purple-400/25 animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-purple-500/50 flex items-center justify-center text-2xl backdrop-blur-sm">
              ⚔️
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Waiting for opponent…
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Match #{matchId} · Checking every 3 seconds
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs">
              You&apos;ll be taken to the draft automatically once someone joins.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="px-7 py-2.5 rounded-[15px] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </BlurCard>
    </div>
  );
}
