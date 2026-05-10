"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArcadeLanding } from "./components/ArcadeLanding";
import { ArcadeWaiting } from "./components/ArcadeWaiting";
import { ArcadeDraft } from "./components/ArcadeDraft";
import { ArcadeResult } from "./components/ArcadeResult";
import { useAuth } from "@/lib/auth-context";
import { getPvpMatchReplay } from "@/lib/api";
import type { PvpOfferedCard } from "@/lib/types";

type ArcadeView =
  | { screen: "landing" }
  | { screen: "resolving" }
  | { screen: "waiting"; matchId: number; role: string }
  | { screen: "draft"; matchId: number; role: string; step: number; picks: PvpOfferedCard[] }
  | { screen: "result"; matchId: number; role: string; picks?: PvpOfferedCard[] };

function ArcadePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const resolvedRef = useRef(false);

  const urlMatchId = searchParams.get("matchId");

  const [view, setView] = useState<ArcadeView>(
    urlMatchId ? { screen: "resolving" } : { screen: "landing" }
  );

  // Resolve matchId from URL to the correct screen
  useEffect(() => {
    if (!urlMatchId || resolvedRef.current) return;
    if (authLoading) return; // wait for auth before determining user's steps

    resolvedRef.current = true;
    const matchId = Number(urlMatchId);

    getPvpMatchReplay(matchId)
      .then((res) => {
        const data = res.data;
        const userId = user?.user_id;

        const role =
          userId !== undefined
            ? data.player1.id === userId
              ? "player1"
              : "player2"
            : "unknown";

        // Reconstruct user's completed picks from draft_steps (now includes chosen_card)
        const mySteps =
          userId !== undefined
            ? data.draft_steps
                .filter((s) => s.user_id === userId && s.chosen_card_id !== null)
                .sort((a, b) => a.step - b.step)
            : [];

        const completedSteps = userId !== undefined ? mySteps.length : 5;
        const picks = mySteps
          .map((s) => s.chosen_card)
          .filter((c): c is NonNullable<typeof c> => c !== null);

        if (completedSteps < 5) {
          setView({ screen: "draft", matchId, role, step: completedSteps + 1, picks });
        } else {
          setView({ screen: "result", matchId, role, picks });
        }
      })
      .catch(() => {
        setView({ screen: "landing" });
      });
  }, [urlMatchId, authLoading, user?.user_id]);

  // Reset to landing when the user navigates to /arcade externally (e.g. sidebar click)
  useEffect(() => {
    if (urlMatchId === null && view.screen !== "landing" && view.screen !== "resolving") {
      resolvedRef.current = true;
      setView({ screen: "landing" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMatchId]);

  // Sync matchId to URL whenever view changes
  useEffect(() => {
    if (view.screen === "resolving") return;
    const current = searchParams.get("matchId");
    if (view.screen === "landing") {
      if (current) router.replace("/arcade");
    } else {
      // If URL was externally cleared (sidebar navigation), don't restore — let the reset effect handle it
      if (current === null) return;
      const next = String(view.matchId);
      if (current !== next) router.replace(`/arcade?matchId=${next}`);
    }
  }, [view, searchParams, router]);

  const navigate = (next: ArcadeView) => {
    resolvedRef.current = true; // don't re-resolve after manual navigation
    setView(next);
  };

  // Resolving state — show spinner while determining screen
  if (view.screen === "resolving") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-purple-400 border-t-transparent animate-spin" />
        <p className="text-sm text-[var(--text-muted)]">Loading match…</p>
      </div>
    );
  }

  if (view.screen === "waiting") {
    return (
      <ArcadeWaiting
        matchId={view.matchId}
        onDraftReady={() =>
          navigate({ screen: "draft", matchId: view.matchId, role: view.role, step: 1, picks: [] })
        }
        onCancel={() => navigate({ screen: "landing" })}
      />
    );
  }

  if (view.screen === "draft") {
    return (
      <ArcadeDraft
        matchId={view.matchId}
        step={view.step}
        picks={view.picks}
        onNextStep={(nextStep, newPick) =>
          navigate({
            screen: "draft",
            matchId: view.matchId,
            role: view.role,
            step: nextStep,
            picks: [...view.picks, newPick],
          })
        }
        onComplete={(lastPick) =>
          navigate({
            screen: "result",
            matchId: view.matchId,
            role: view.role,
            picks: [...view.picks, lastPick],
          })
        }
      />
    );
  }

  if (view.screen === "result") {
    return (
      <ArcadeResult
        matchId={view.matchId}
        isPlayer1={view.role === "player1" ? true : view.role === "player2" ? false : undefined}
        myPicks={view.picks}
        onPlayAgain={() => navigate({ screen: "landing" })}
      />
    );
  }

  return (
    <ArcadeLanding
      onJoined={(matchId, role) => navigate({ screen: "waiting", matchId, role })}
      onViewMatch={(matchId) => navigate({ screen: "result", matchId, role: "unknown" })}
    />
  );
}

export default function ArcadePage() {
  return (
    <Suspense fallback={null}>
      <ArcadePageContent />
    </Suspense>
  );
}
