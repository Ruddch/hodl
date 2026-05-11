"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useMyTournaments, useClaimTournamentRewards } from "@/lib/api";
import { BlurCard } from "@/components/BlurCard";
import { PrizeRewardsDisplay } from "@/components/PrizeRewardsDisplay";
import { flattenDeckPrizes } from "@/lib/prize-rewards";
import type { MyTournamentEntry } from "@/lib/types";
import { getTournamentDisplayName } from "@/lib/utils/tournaments";

const STORAGE_KEY_PREFIX = "hodleague_tournament_result_seen_";
/** Пауза после успешного клейма, чтобы пользователь успел осознать успех */
const CLAIM_SUCCESS_CLOSE_DELAY_MS = 900;

function getSeenKey(walletAddress: string): string {
  return `${STORAGE_KEY_PREFIX}${walletAddress.toLowerCase()}`;
}

function hasUnclaimedRewards(entry: MyTournamentEntry): boolean {
  return (entry.prizes ?? []).some(
    (p) => p.claim_status !== "claimed" && p.claim_status !== null
  );
}

/** API возвращает отдельную запись на каждую колоду; группируем по tournament_id. */
function groupFinishedEntriesByTournament(
  tournaments: MyTournamentEntry[]
): Map<number, MyTournamentEntry[]> {
  const map = new Map<number, MyTournamentEntry[]>();
  for (const t of tournaments) {
    if (t.status !== "finished") continue;
    const list = map.get(t.tournament_id) ?? [];
    list.push(t);
    map.set(t.tournament_id, list);
  }
  return map;
}

function entriesHaveUnclaimedRewards(entries: MyTournamentEntry[]): boolean {
  return entries.some((e) => hasUnclaimedRewards(e));
}

export function useTournamentResultModal() {
  const { isAuthenticated, signedWalletAddress } = useAuth();
  const { data } = useMyTournaments(isAuthenticated);
  const [showModal, setShowModal] = useState(false);
  const [entries, setEntries] = useState<MyTournamentEntry[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !signedWalletAddress || !data?.tournaments) return;

    const timer = requestAnimationFrame(() => {
      const byTournament = groupFinishedEntriesByTournament(data.tournaments);
      const candidates = [...byTournament.entries()]
        .filter(([, group]) => entriesHaveUnclaimedRewards(group))
        .map(([tournamentId, group]) => ({
          tournamentId,
          group,
          end: new Date(group[0].end_date).getTime(),
        }))
        .sort((a, b) => b.end - a.end);

      const latest = candidates[0];
      if (!latest) return;

      const key = getSeenKey(signedWalletAddress);
      let seen: number[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        seen = [];
      }

      if (!seen.includes(latest.tournamentId)) {
        latest.group.sort((a, b) => a.deck_id - b.deck_id);
        setEntries(latest.group);
        setShowModal(true);
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [isAuthenticated, signedWalletAddress, data]);

  const close = useCallback(() => {
    if (entries?.length && signedWalletAddress) {
      const tournamentId = entries[0].tournament_id;
      const key = getSeenKey(signedWalletAddress);
      let seen: number[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        seen = [];
      }
      if (!seen.includes(tournamentId)) {
        localStorage.setItem(
          key,
          JSON.stringify([...seen, tournamentId])
        );
      }
    }
    setShowModal(false);
  }, [entries, signedWalletAddress]);

  return { showModal, entries, close };
}

interface TournamentResultModalProps {
  entries: MyTournamentEntry[];
  onClose: () => void;
}

export function TournamentResultModal({
  entries,
  onClose,
}: TournamentResultModalProps) {
  const claimMutation = useClaimTournamentRewards();
  const closeAfterClaimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [closingAfterSuccess, setClosingAfterSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (closeAfterClaimTimerRef.current != null) {
        clearTimeout(closeAfterClaimTimerRef.current);
        closeAfterClaimTimerRef.current = null;
      }
    };
  }, []);

  const primary = entries[0];
  const mergedPrizes = useMemo(
    () => flattenDeckPrizes(entries),
    [entries]
  );
  const canClaim = entries.some((e) => hasUnclaimedRewards(e));
  const tournamentName = getTournamentDisplayName(primary.tournament_id, primary.start_date);

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync(primary.tournament_id);
      setClosingAfterSuccess(true);
      closeAfterClaimTimerRef.current = setTimeout(() => {
        closeAfterClaimTimerRef.current = null;
        onClose();
      }, CLAIM_SUCCESS_CLOSE_DELAY_MS);
    } catch {
      /* ошибка сети/API — модалку не закрываем */
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={onClose}
      />

      <div
        className="relative bg-[var(--surface)] w-full max-w-[480px] rounded-[32px] border border-[var(--border-subtle)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <BlurCard
          backgroundColor="rgba(147, 253, 121, 1)"
          borderRadius={32}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-3">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label="Close"
              data-ph-capture-attribute-button="tournament-result-modal-close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2
              className="text-lg md:text-2xl font-semibold leading-7 md:leading-8 tracking-normal text-[var(--text-primary)] pr-10"
              style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
            >
              Congrats! Your prize{" "}
              <PrizeRewardsDisplay prizes={mergedPrizes} size="md" className="align-middle" />
            </h2>
            <p
              className="text-sm md:text-base font-normal leading-6 md:leading-8 tracking-normal text-[var(--text-secondary)]"
              style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
            >
              You&apos;ve nailed it in the {tournamentName} tournament
            </p>
          </div>

          {/* Claim image */}
          <div className="relative w-full" style={{ aspectRatio: "600/642" }}>
            <Image
              src="/claim.png"
              alt="Your prize"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Button */}
          <div className="p-6 pt-0">
            <button
              onClick={canClaim && !closingAfterSuccess ? handleClaim : onClose}
              disabled={claimMutation.isPending || closingAfterSuccess}
              className="w-full py-4 rounded-[15px] bg-[#2200EF] text-white font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                fontFamily: "var(--font-instrument-sans), sans-serif",
              }}
              data-ph-capture-attribute-button="tournament-result-modal-claim"
            >
              {claimMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      stroke="currentColor"
                      strokeOpacity="0.3"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 2A6 6 0 0 1 14 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Claiming...
                </span>
              ) : closingAfterSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3 8L6.5 11.5L13 5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Rewards claimed
                </span>
              ) : canClaim ? (
                "Claim your prize"
              ) : (
                "Close"
              )}
            </button>
          </div>
        </BlurCard>
      </div>
    </div>
  );
}
