"use client";

import { useTournamentDeck } from "@/lib/api";
import { Deck } from "@/components/Deck";
import { Avatar } from "@/components/Avatar";
import { BlurCard } from "./BlurCard";

interface DeckDetailModalProps {
  open: boolean;
  onClose: () => void;
  tournamentId: number | undefined;
  deckId: number | undefined;
}

export function DeckDetailModal({
  open,
  onClose,
  tournamentId,
  deckId,
}: DeckDetailModalProps) {
  const { data: deck, isLoading } = useTournamentDeck(tournamentId, deckId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
     
      <div
        className="relative bg-white w-full max-w-[900px] max-h-[90vh] overflow-hidden mx-4 rounded-[30px] border border-white/10"

        onClick={(e) => e.stopPropagation()}
      >
        <BlurCard blurValue={150} backgroundColor="rgba(141, 121, 253, 0.5)">
        <div className="relative flex flex-col max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0 min-w-0">
            {deck ? (
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  walletAddress={deck.wallet_address ?? undefined}
                  fallbackSeed={deck.user_id}
                  size={40}
                  avatarUrl={deck.avatar_url ?? undefined}
                />
                <span className="text-base font-medium text-black truncate">
                  {deck.nickname ||
                    (deck.wallet_address
                      ? `${deck.wallet_address.slice(0, 6)}...${deck.wallet_address.slice(-4)}`
                      : `User #${deck.user_id}`)}
                </span>
              </div>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="p-2 cursor-pointer text-zinc-500 hover:text-black transition-colors rounded-lg hover:bg-black/5 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {deck || isLoading ? (
            <Deck
              deckDetail={deck ?? null}
              deckLoading={isLoading}
              wrapInBlurCard={false}
            />
          ) : (
            <div className="px-6 pb-8 text-zinc-500">Deck not found</div>
          )}
          </div>
          </BlurCard>
        </div>
    </div>
  );
}
