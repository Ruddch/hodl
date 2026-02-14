"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { UserInfo } from "./UserInfo";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useTournaments, useAvailablePacks } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { TournamentIcon, LeaderboardIcon, PacksIcon } from "./Icons";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: tournamentsData } = useTournaments({ limit: 10 });
  const { isAuthenticated } = useAuth();
  const { data: packsData } = useAvailablePacks(isAuthenticated);
  
  // Проверяем есть ли открытый турнир
  const hasOpenTournament = tournamentsData?.items.some(t => t.status === "registration");
  
  // Получаем количество доступных паков из API
  const availablePacks = packsData?.available_packs || 0;

  // Определяем активность табов
  const isTournamentActive = pathname === "/tournament" || pathname?.startsWith("/tournament");
  const isLeaderboardActive = pathname === "/leaderboard" || pathname?.startsWith("/leaderboard");
  const isPacksActive = pathname === "/packs" || pathname?.startsWith("/packs");

  // Цвета для иконок (используем CSS-переменные для поддержки тёмной темы)
  const tournamentIconColor = isTournamentActive ? "var(--nav-item-active-text)" : "var(--nav-item-inactive)";
  const leaderboardIconColor = isLeaderboardActive ? "var(--nav-item-active-text)" : "var(--nav-item-inactive)";
  const packsIconColor = isPacksActive ? "var(--nav-item-active-text)" : "var(--nav-item-inactive)";

  // Закрываем меню при переходе на другую страницу на мобильных
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={`
        w-72 bg-[var(--sidebar-bg)] flex flex-col h-dvh fixed left-0 top-0 rounded-r-[30px] border border-[var(--border-subtle)] backdrop-blur-[75px] z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static
      `}
    >
      {/* Logo и кнопка закрытия — скрыты на мобильных при открытом сайдбаре (есть в навбаре) */}
      <div className={`px-8 pt-8 flex items-center justify-between shrink-0 hidden display-none md:flex`}>
        <div className="flex items-center gap-1">
          <Logo />
          <span className="text-[26px] font-medium text-[var(--text-primary)]">Hodleague</span>
        </div>
        <div className="hidden md:block shrink-0">
          <ThemeToggle />
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <svg
            className="w-6 h-6 text-[var(--text-primary)]"
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
      {/* Отступ сверху на мобильных при открытом сайдбаре — навбар перекрывает */}
      {/* {isOpen && <div className="md:hidden h-16 shrink-0" aria-hidden />} */}
      
      {/* Navigation */}
      <nav className="flex-1 px-4  pt-16 md:pt-10">
        <ul className="space-y-0">
          {/* Tournament */}
          <li>
            <Link
              href="/tournament"
              onClick={onClose}
              className={`flex items-center gap-[5px] px-2 md:px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isTournamentActive
                  ? "bg-[var(--nav-item-active-bg)] text-[var(--nav-item-active-text)]"
                  : "text-[var(--nav-item-inactive)] hover:text-[var(--nav-item-inactive-hover)]"
              }`}
            >
              {/* Tournament icon */}
              <TournamentIcon 
                width={16} 
                height={16} 
                strokeColor={tournamentIconColor}
                strokeOpacity={isTournamentActive ? 1 : 0.5}
              />
              <span className="text-[16px]">Tournament</span>
              {hasOpenTournament && (
                <span className="ml-auto px-2.5 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[var(--badge-opened)] text-[var(--badge-opened-text)]">
                  OPENED
                </span>
              )}
            </Link>
          </li>
          
          {/* Leaderboard */}
          <li>
            <Link
              href="/leaderboard"
              onClick={onClose}
              className={`flex items-center gap-[5px] px-2 md:px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isLeaderboardActive
                  ? "bg-[var(--nav-item-active-bg)] text-[var(--nav-item-active-text)]"
                  : "text-[var(--nav-item-inactive)] hover:text-[var(--nav-item-inactive-hover)]"
              }`}
            >
              {/* Leaderboard icon */}
              <LeaderboardIcon 
                width={16} 
                height={16} 
                strokeColor={leaderboardIconColor}
                strokeOpacity={isLeaderboardActive ? 1 : 0.5}
              />
              <span className="text-[16px]">Leaderboard</span>
            </Link>
          </li>
          
          {/* Packs */}
          <li>
            <Link
              href="/packs"
              onClick={onClose}
              className={`flex items-center gap-[5px] px-2 md:px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isPacksActive
                  ? "bg-[var(--nav-item-active-bg)] text-[var(--nav-item-active-text)]"
                  : "text-[var(--nav-item-inactive)] hover:text-[var(--nav-item-inactive-hover)]"
              }`}
            >
              {/* Packs icon */}
              <PacksIcon 
                width={16} 
                height={16} 
                strokeColor={packsIconColor}
                strokeOpacity={isPacksActive ? 1 : 0.5}
                fillColor="var(--icon-bg)"
              />
              <span className="text-[16px]">Packs</span>
              {availablePacks > 0 && (
                <span 
                  className="ml-auto flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--badge-count)',
                    borderRadius: '4px',
                    border: '1px solid var(--packs-badge-border)',
                  }}
                >
                  {availablePacks}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* User Info */}
      <UserInfo onNavClick={onClose} />
    </aside>
  );
}
