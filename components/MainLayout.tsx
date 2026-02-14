"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";
import { ThemeToggle } from "./ThemeToggle";
import { WelcomeModal, useWelcomeModal } from "./WelcomeModal";
import { WelcomeClosedContext } from "@/lib/welcome-closed-context";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

function MainLayoutInner({ children, title }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { showWelcome, closeWelcome } = useWelcomeModal();
  const [welcomeJustClosed, setWelcomeJustClosed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  /** При закрытии welcome — сигнал для онбординга на текущей странице */
  const handleWelcomeClose = useCallback(() => {
    closeWelcome();
    setWelcomeJustClosed(true);
  }, [closeWelcome, setWelcomeJustClosed]);

  const welcomeClosedValue = {
    welcomeJustClosed,
    setWelcomeJustClosed,
    welcomeVisible: showWelcome ?? false,
  };

  return (
    <WelcomeClosedContext.Provider value={welcomeClosedValue}>
    <div className="flex h-dvh bg-[var(--background)]">
      {/* Мобильная навигационная панель в стиле сайдбара */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-2 px-6 py-4 touch-none select-none ${isSidebarOpen ? "bg-[var(--sidebar-bg)]" : "bg-transparent"} backdrop-blur-[75px] rounded-br-[30px]`}>
        <PageHeader onClick={toggleSidebar} title={title} isSidebarOpen={isSidebarOpen} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
          onClick={toggleSidebar}
          className="relative p-2 -m-2 hover:bg-[var(--sidebar-hover)] rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {/* Бургер — плавный переход в крестик */}
          <svg
            className={`absolute w-6 h-6 text-[var(--text-primary)] transition-all duration-300 ${
              isSidebarOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            className={`absolute w-6 h-6 text-[var(--text-primary)] transition-all duration-300 ${
              isSidebarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        </div>
      </div>

      {/* Overlay для мобильных */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 touch-none select-none transition-opacity"
          style={{ backgroundColor: "var(--overlay)" }}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Основной контент */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-[var(--background)] pt-18 py-5 px-4 md:py-6 md:px-6">{children}</main>
      </div>

      {/* Приветственная модалка для новых пользователей */}
      {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
    </div>
    </WelcomeClosedContext.Provider>
  );
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return <MainLayoutInner title={title}>{children}</MainLayoutInner>;
}

