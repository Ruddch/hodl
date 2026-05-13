"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ArcadeLanding } from "./components/ArcadeLanding";
import { ArcadeWaiting } from "./components/ArcadeWaiting";
import { ArcadeDraft } from "./components/ArcadeDraft";
import { ArcadeResult } from "./components/ArcadeResult";
import { usePvpMatchScreen } from "./usePvpMatchScreen";

const LOBBY_DURATION_MS = 5_000;

function ArcadePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const urlMatchId = searchParams.get("matchId");
  const matchId = urlMatchId ? Number(urlMatchId) : null;

  // Track which matchId was freshly joined (vs opened from history/reload)
  const [newGameMatchId, setNewGameMatchId] = useState<number | null>(null);
  const minLoadingMs = matchId !== null && matchId === newGameMatchId ? LOBBY_DURATION_MS : 0;

  const { isLoading, secondsLeft, totalSeconds, screen, player1, player2, error, refetch } =
    usePvpMatchScreen(matchId, minLoadingMs);

  const uid = user?.user_id;
  const opponentPlayer =
    uid !== undefined && player1 && player2
      ? player1.id === uid
        ? player2
        : player2.id === uid
          ? player1
          : null
      : null;

  // Redirect to landing on unrecoverable error
  useEffect(() => {
    if (error) router.replace("/arcade");
  }, [error, router]);

  if (!matchId) {
    return (
      <ArcadeLanding
        onPlay={(newMatchId) => {
          setNewGameMatchId(newMatchId);
          router.replace(`/arcade?matchId=${newMatchId}`);
        }}
        onViewMatch={(id) => router.replace(`/arcade?matchId=${id}`)}
      />
    );
  }

  if (isLoading) {
    return (
      <ArcadeWaiting
        secondsLeft={secondsLeft}
        totalSeconds={totalSeconds}
        player1={player1}
        player2={player2}
        onCancel={() => router.replace("/arcade")}
      />
    );
  }

  if (screen?.screen === "draft") {
    return (
      <ArcadeDraft
        matchId={matchId}
        opponentPlayer={opponentPlayer}
        initialStep={screen.step}
        initialPicks={screen.initialPicks}
        onComplete={refetch}
      />
    );
  }

  if (screen?.screen === "result") {
    return (
      <ArcadeResult
        matchId={matchId}
        isPlayer1={screen.role === "player1" ? true : screen.role === "player2" ? false : undefined}
        onPlayAgain={() => router.replace("/arcade")}
      />
    );
  }

  return null;
}

export default function ArcadePage() {
  return (
    <Suspense fallback={null}>
      <ArcadePageContent />
    </Suspense>
  );
}
