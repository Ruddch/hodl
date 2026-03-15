"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useMyTournaments, useClaimTournamentRewards } from "@/lib/api";
import { BlurCard } from "@/components/BlurCard";
import type { MyTournamentEntry } from "@/lib/types";

const STORAGE_KEY_PREFIX = "hodleague_tournament_result_seen_";

function getSeenKey(walletAddress: string): string {
  return `${STORAGE_KEY_PREFIX}${walletAddress.toLowerCase()}`;
}

function hasUnclaimedRewards(entry: MyTournamentEntry): boolean {
  return (entry.prizes ?? []).some(
    (p) => p.claim_status !== "claimed" && p.claim_status !== null
  );
}

function getTournamentName(entry: MyTournamentEntry): string {
  const date = new Date(entry.end_date || entry.start_date);
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)} fire`;
}

export function useTournamentResultModal() {
  const { isAuthenticated, signedWalletAddress } = useAuth();
  const { data } = useMyTournaments(isAuthenticated);
  const [showModal, setShowModal] = useState(false);
  const [entry, setEntry] = useState<MyTournamentEntry | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !signedWalletAddress || !data?.tournaments) return;

    const timer = requestAnimationFrame(() => {
      const latest = [...data.tournaments]
        .filter((t) => t.status === "finished" && hasUnclaimedRewards(t))
        .sort(
          (a, b) =>
            new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
        )[0];

      if (!latest) return;

      const key = getSeenKey(signedWalletAddress);
      let seen: number[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        seen = [];
      }

      if (!seen.includes(latest.tournament_id)) {
        setEntry(latest);
        setShowModal(true);
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [isAuthenticated, signedWalletAddress, data]);

  const close = useCallback(() => {
    if (entry && signedWalletAddress) {
      const key = getSeenKey(signedWalletAddress);
      let seen: number[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {
        seen = [];
      }
      if (!seen.includes(entry.tournament_id)) {
        localStorage.setItem(
          key,
          JSON.stringify([...seen, entry.tournament_id])
        );
      }
    }
    setShowModal(false);
  }, [entry, signedWalletAddress]);

  return { showModal, entry, close };
}

interface TournamentResultModalProps {
  entry: MyTournamentEntry;
  onClose: () => void;
}

export function TournamentResultModal({
  entry,
  onClose,
}: TournamentResultModalProps) {
  const claimMutation = useClaimTournamentRewards();
  const [claimed, setClaimed] = useState(false);

  const canClaim = hasUnclaimedRewards(entry) && !claimed;
  const totalRewards = (entry.prizes ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const primaryCurrency = entry.prizes[0]?.currency_type ?? "";
  const tournamentName = getTournamentName(entry);

  const handleClaim = async () => {
    await claimMutation.mutateAsync(entry.tournament_id);
    setClaimed(true);
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
              {totalRewards.toLocaleString("en-US")} {primaryCurrency}
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
            {claimed ? (
              <div
                className="w-full py-4 rounded-[15px] bg-black/5 text-[var(--text-secondary)] font-medium text-base text-center flex items-center justify-center gap-2"
                style={{
                  fontFamily: "var(--font-instrument-sans), sans-serif",
                }}
              >
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
                Rewards Claimed
              </div>
            ) : (
              <button
                onClick={canClaim ? handleClaim : onClose}
                disabled={claimMutation.isPending}
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
                ) : canClaim ? (
                  "Claim your prize"
                ) : (
                  "Close"
                )}
              </button>
            )}
          </div>
        </BlurCard>
      </div>
    </div>
  );
}
