"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePvpMatchReplay } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PvpOfferedCard, PvpReplayPlayer } from "@/lib/types";

export type MatchScreen =
  | { screen: "draft"; step: number; role: string; initialPicks: PvpOfferedCard[] }
  | { screen: "result"; role: string };

export interface UsePvpMatchScreenResult {
  isLoading: boolean;
  secondsLeft: number;
  totalSeconds: number;
  screen: MatchScreen | null;
  player1: PvpReplayPlayer | null;
  player2: PvpReplayPlayer | null;
  error: boolean;
  refetch: () => void;
}

export function usePvpMatchScreen(
  matchId: number | null,
  minLoadingMs = 0
): UsePvpMatchScreenResult {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: replayResponse, isLoading: queryLoading, isError } = usePvpMatchReplay(
    matchId ?? undefined
  );
  const replayData = replayResponse?.data ?? null;

  // Capture minLoadingMs when matchId changes (so mid-session changes don't reset the timer)
  const capturedMinLoadingRef = useRef(0);
  const loadingStartRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the moment player2 first appeared (null = not yet seen)
  const player2SeenRef = useRef<number | null>(null);

  const initialSeconds = Math.ceil(minLoadingMs / 1000);
  const [timedOut, setTimedOut] = useState(minLoadingMs <= 0);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  // Reset when matchId changes
  useEffect(() => {
    capturedMinLoadingRef.current = minLoadingMs;
    loadingStartRef.current = Date.now();
    player2SeenRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimedOut(minLoadingMs <= 0);
    const secs = Math.ceil(minLoadingMs / 1000);
    setSecondsLeft(secs);
    setTotalSeconds(secs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // When player2 appears for the first time while still in the lobby,
  // extend the timer to 3 s from now and reset the countdown display.
  useEffect(() => {
    if (!replayData?.player2 || player2SeenRef.current !== null || timedOut) return;
    player2SeenRef.current = Date.now();
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTimedOut(true), 3000);
    setSecondsLeft(3);
    setTotalSeconds(3);
  }, [replayData?.player2, timedOut]);

  // Once data arrives (and player2 not yet found), schedule "timedOut" after remaining base time
  useEffect(() => {
    if (timedOut || queryLoading || !replayData) return;
    // If player2 already detected, the effect above owns the timer
    if (player2SeenRef.current !== null) return;
    const minMs = capturedMinLoadingRef.current;
    const elapsed = Date.now() - loadingStartRef.current;
    const remaining = Math.max(0, minMs - elapsed);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTimedOut(true), remaining);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [timedOut, queryLoading, replayData]);

  // Countdown display
  useEffect(() => {
    if (timedOut || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [timedOut, secondsLeft]);

  // Cleanup on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const isLoading = !timedOut || queryLoading || authLoading || !replayData;

  const screen = useMemo((): MatchScreen | null => {
    if (isLoading || !replayData) return null;

    const userId = user?.user_id;
    const role =
      userId !== undefined
        ? replayData.player1?.id === userId
          ? "player1"
          : "player2"
        : "unknown";

    if (replayData.status === "completed") {
      return { screen: "result", role };
    }

    const mySteps =
      userId !== undefined
        ? replayData.draft_steps
            .filter((s) => s.user_id === userId && s.chosen_card_id !== null)
            .sort((a, b) => a.step - b.step)
        : [];
    const completedSteps = userId !== undefined ? mySteps.length : 5;
    const initialPicks = mySteps
      .map((s) => s.chosen_card)
      .filter((c): c is PvpOfferedCard => c !== null);

    return completedSteps >= 5
      ? { screen: "result", role }
      : { screen: "draft", step: completedSteps + 1, role, initialPicks };
  }, [isLoading, replayData, user?.user_id]);

  const refetch = () => {
    if (!matchId) return;
    queryClient.invalidateQueries({ queryKey: ["pvpReplay", matchId] });
    setTimedOut(true); // no artificial delay on refetch
  };

  return {
    isLoading,
    secondsLeft,
    totalSeconds,
    screen,
    player1: replayData?.player1 ?? null,
    player2: replayData?.player2 ?? null,
    error: isError,
    refetch,
  };
}
