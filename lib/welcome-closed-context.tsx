"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type WelcomeClosedContextValue = {
  /** true после того, как пользователь закрыл Welcome modal в этой сессии */
  welcomeJustClosed: boolean;
  setWelcomeJustClosed: (value: boolean) => void;
  /** true пока Welcome modal открыт — онбординг не должен стартовать */
  welcomeVisible: boolean;
};

export const WelcomeClosedContext = createContext<WelcomeClosedContextValue | null>(null);

export function WelcomeClosedProvider({
  children,
  welcomeVisible = false,
}: {
  children: ReactNode;
  welcomeVisible?: boolean;
}) {
  const [welcomeJustClosed, setWelcomeJustClosed] = useState(false);
  return (
    <WelcomeClosedContext.Provider
      value={{ welcomeJustClosed, setWelcomeJustClosed, welcomeVisible }}
    >
      {children}
    </WelcomeClosedContext.Provider>
  );
}

export function useWelcomeClosed() {
  const ctx = useContext(WelcomeClosedContext);
  if (!ctx) {
    return {
      welcomeJustClosed: false,
      setWelcomeJustClosed: () => {},
      welcomeVisible: false,
    };
  }
  return ctx;
}
