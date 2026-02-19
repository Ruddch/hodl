"use client";

import { DeckSelectionModal } from "@/components/DeckSelectionModal";
import { Toast } from "@/components/Toast";
import { Onboarding } from "@/components/OnboardingLazy";
import { useTournamentDetails } from "@/lib/api";
import { useTournamentSelector } from "@/lib/hooks/useTournamentSelector";
import { useAuth } from "@/lib/auth-context";
import {
  useTournamentRegistration,
  type RegistrationErrorContext,
} from "@/lib/hooks/useTournamentRegistration";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { TOURNAMENT_ONBOARDING } from "@/lib/onboarding-config";
import { useState, Suspense } from "react";

import { TournamentFilters } from "@/components/tournament";
import { TournamentInfoCard } from "./components/TournamentInfoCard";
import { Deck } from "@/components/Deck";
import { LeaderboardPreviewCard } from "./components/LeaderboardPreviewCard";
import { TournamentPageSkeleton } from "./components/TournamentPageSkeleton";

function getFriendlyErrorMessage(rawMessage: string, context: RegistrationErrorContext): string {
  const m = rawMessage.toLowerCase();
  if (
    m.includes("reject") ||
    m.includes("denied") ||
    m.includes("deny") ||
    m.includes("cancel") ||
    m.includes("user denied") ||
    m.includes("user rejected")
  ) {
    return "Transaction was cancelled by the user.";
  }
  if (m.includes("кошелек") || m.includes("wallet") || m.includes("mismatch")) {
    return "Wallet mismatch. Please switch to the correct wallet.";
  }
  if (context === "register") return "Registration error. Try again later.";
  if (context === "unregister") return "Unregistration failed. Try again later.";
  return "Something went wrong. Try again later.";
}

function TournamentPageContent() {
  const { isAuthenticated, login } = useAuth();
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [toastError, setToastError] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });

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
    isAuthenticated && !isLoading && !!tournamentDisplay
  );

  const canRegister =
    tournamentDisplay?.status === "registration" && !tournamentDisplay?.is_registered;

  const { register, unregister, isRegistering, isUnregistering } = useTournamentRegistration({
    onSuccess: () => {
      selector.refetchTournaments();
      refetchDetails();
      setShowDeckModal(false);
    },
    onError: (error, context) => {
      const message = getFriendlyErrorMessage(error.message, context);
      setToastError({ visible: true, message });
    },
  });

  const handleOpenDeckModal = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setShowDeckModal(true);
  };

  const handleCloseDeckModal = () => setShowDeckModal(false);

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
          <TournamentPageSkeleton />
        ) : tournamentDisplay ? (
          <div className="space-y-5">
            <TournamentInfoCard
              tournament={tournamentDisplay}
              onRegisterClick={handleOpenDeckModal}
            />
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
          onClose={handleCloseDeckModal}
          onRegister={handleRegister}
          isRegistering={isRegistering}
        />
      )}

      <Toast
        visible={toastError.visible}
        onDismiss={() => setToastError((p) => ({ ...p, visible: false }))}
        variant="error"
        message={toastError.message}
      />
    </>
  );
}

export default function TournamentPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-8xl mx-auto">
          <TournamentPageSkeleton />
        </div>
      }
    >
      <TournamentPageContent />
    </Suspense>
  );
}
