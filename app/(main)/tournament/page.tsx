"use client";

import { DeckSelectionModal } from "@/components/DeckSelectionModal";
import { Onboarding } from "@/components/Onboarding";
import { useTournamentDetails } from "@/lib/api";
import { useTournamentSelector } from "@/lib/hooks/useTournamentSelector";
import { useAuth } from "@/lib/auth-context";
import { useTournamentRegistration } from "@/lib/hooks/useTournamentRegistration";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { TOURNAMENT_ONBOARDING } from "@/lib/onboarding-config";
import { useState, Suspense } from "react";

import { TournamentFilters } from "@/components/tournament";
import { TournamentInfoCard } from "./components/TournamentInfoCard";
import { Deck } from "@/components/Deck";
import { LeaderboardPreviewCard } from "./components/LeaderboardPreviewCard";

function TournamentPageContent() {
  const { isAuthenticated, login } = useAuth();
  const [showDeckModal, setShowDeckModal] = useState(false);

  const selector = useTournamentSelector({ defaultStrategy: "active" });
  const {
    epochKeys,
    currentEpoch,
    tournamentsInEpoch,
    currentTournamentId,
    isLoading: tournamentsLoading,
    onSelectEpoch,
    onSelectTournament,
  } = selector;

  const { data: tournamentDetails, isLoading: detailsLoading, refetch: refetchDetails } =
    useTournamentDetails(currentTournamentId ?? undefined, true, {
      refetchInterval: 5 * 60 * 1000,
    });

  const tournamentDisplay = tournamentDetails || tournamentsInEpoch.find((t) => t.id === currentTournamentId);

  const isLoading = tournamentsLoading || detailsLoading;

  const { run, steps, close, complete } = usePageOnboarding(
    "tournament",
    TOURNAMENT_ONBOARDING,
    !isLoading && !!tournamentDisplay
  );

  const canRegister =
    tournamentDisplay?.status === "registration" && !tournamentDisplay?.is_registered;

  const { register, unregister, isRegistering, isUnregistering } = useTournamentRegistration({
    onSuccess: () => {
      selector.refetchTournaments();
      refetchDetails();
      setShowDeckModal(false);
    },
  });

  const handleOpenDeckModal = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setShowDeckModal(true);
  };

  const handleRegister = async (selectedCardIds: number[]) => {
    if (!tournamentDisplay) return;
    await register(tournamentDisplay, selectedCardIds);
  };

  const handleUnregister = async () => {
    if (!tournamentDisplay) return;
    await unregister(tournamentDisplay);
  };

  return (
    <>
      <div className="max-w-8xl mx-auto">
        <TournamentFilters
          isLoading={tournamentsLoading}
          epochKeys={epochKeys}
          currentEpoch={currentEpoch}
          tournamentsInEpoch={tournamentsInEpoch}
          currentTournamentId={currentTournamentId}
          onSelectEpoch={onSelectEpoch}
          onSelectTournament={onSelectTournament}
          className="mb-8"
        />

        {isLoading && !tournamentDisplay ? (
          <div className="space-y-5">
            <div className="h-48 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
            <div className="h-64 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
            <div className="h-64 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
          </div>
        ) : tournamentDisplay ? (
          <div className="space-y-5">
            <TournamentInfoCard tournament={tournamentDisplay} onRegisterClick={handleOpenDeckModal} />
            <Deck
              isRegistered={tournamentDisplay.is_registered || false}
              onStartClick={handleOpenDeckModal}
              canRegister={canRegister}
              myDeck={tournamentDetails?.my_deck}
              tournamentStatus={tournamentDisplay.status}
              tournamentId={tournamentDisplay.id}
              onUnregister={handleUnregister}
              isUnregistering={isUnregistering}
            />
            <LeaderboardPreviewCard
              tournamentStatus={tournamentDisplay.status}
              tournamentId={tournamentDisplay.id}
              epoch={currentEpoch}
            />
          </div>
        ) : (
          <div className="bg-[var(--surface)] rounded-2xl p-8 text-center">
            <p className="text-[var(--text-muted)]">Select a tournament</p>
          </div>
        )}
      </div>

      <Onboarding steps={steps} run={run} onClose={close} onComplete={complete} />

      {showDeckModal && tournamentDisplay && (
        <DeckSelectionModal
          tournament={tournamentDisplay}
          onClose={() => setShowDeckModal(false)}
          onRegister={handleRegister}
          isRegistering={isRegistering}
        />
      )}
    </>
  );
}

export default function TournamentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-8xl mx-auto">
          <div className="space-y-5">
            <div className="h-48 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
            <div className="h-64 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
            <div className="h-64 bg-[var(--surface-elevated)] rounded-[30px] animate-pulse" />
          </div>
        </div>
      }
    >
      <TournamentPageContent />
    </Suspense>
  );
}
