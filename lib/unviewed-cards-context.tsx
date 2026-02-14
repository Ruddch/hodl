"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount } from "wagmi";

const STORAGE_PREFIX = "hodleague-unviewed-cards";

function getStorageKey(address: string | undefined): string {
  return address ? `${STORAGE_PREFIX}-${address.toLowerCase()}` : STORAGE_PREFIX;
}

function getStored(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "true";
}

function setStored(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(key, "true");
  } else {
    localStorage.removeItem(key);
  }
}

interface UnviewedCardsContextValue {
  hasUnviewedCards: boolean;
  setUnviewedCards: () => void;
  clearUnviewedCards: () => void;
}

const UnviewedCardsContext = createContext<UnviewedCardsContextValue | null>(
  null
);

export function UnviewedCardsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address } = useAccount();
  const key = getStorageKey(address);

  const [hasUnviewedCards, setHasUnviewedCardsState] = useState(false);

  useEffect(() => {
    setHasUnviewedCardsState(getStored(key));
  }, [key]);

  const setUnviewedCards = useCallback(() => {
    setStored(key, true);
    setHasUnviewedCardsState(true);
  }, [key]);

  const clearUnviewedCards = useCallback(() => {
    setStored(key, false);
    setHasUnviewedCardsState(false);
  }, [key]);

  const value = useMemo(
    () => ({
      hasUnviewedCards,
      setUnviewedCards,
      clearUnviewedCards,
    }),
    [hasUnviewedCards, setUnviewedCards, clearUnviewedCards]
  );

  return (
    <UnviewedCardsContext.Provider value={value}>
      {children}
    </UnviewedCardsContext.Provider>
  );
}

export function useUnviewedCards() {
  const ctx = useContext(UnviewedCardsContext);
  return ctx ?? { hasUnviewedCards: false, setUnviewedCards: () => {}, clearUnviewedCards: () => {} };
}
