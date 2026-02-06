"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { UserInfo } from "./UserInfo";
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

  // Цвета для иконок
  const tournamentIconColor = isTournamentActive ? "black" : "rgba(0, 0, 0, 0.5)";
  const leaderboardIconColor = isLeaderboardActive ? "black" : "rgba(0, 0, 0, 0.5)";
  const packsIconColor = isPacksActive ? "black" : "rgba(0, 0, 0, 0.5)";

  // Закрываем меню при переходе на другую страницу на мобильных
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={`
        w-72 bg-[#f6f6f6] flex flex-col h-screen fixed left-0 top-0 rounded-r-[30px] border border-white/10 backdrop-blur-[75px] z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static
      `}
    >
      {/* Logo и кнопка закрытия для мобильных */}
      <div className="px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-[24px] h-[24px] text-black flex items-center justify-center overflow-hidden">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M6.41047 2.35023e-08C6.12406 1.09829e-08 5.90162 0.249602 5.93447 0.534121L7.44135 13.5852C7.46927 13.8269 7.67398 14.0094 7.91735 14.0094L10.8684 14.0094C11.133 14.0094 11.3475 13.7949 11.3475 13.5302L11.3475 0.479161C11.3475 0.214527 11.133 2.2993e-07 10.8684 2.18363e-07L6.41047 2.35023e-08Z" fill="black"/>
              <path d="M4.93694 14.0098C5.22335 14.0098 5.44579 13.7602 5.41294 13.4756L3.90606 0.424584C3.87814 0.182819 3.67343 0.000380437 3.43006 0.000380427L0.479051 0.000380298C0.214417 0.000380286 -0.0001105 0.214908 -0.000110512 0.479542L-0.000111082 13.5306C-0.000111094 13.7952 0.214417 14.0098 0.47905 14.0098L4.93694 14.0098Z" fill="black"/>
              <rect x="4.00781" y="5.53418" width="4.06272" height="1.68113" transform="rotate(15 4.00781 5.53418)" fill="black"/>
            </svg>
          </div>
          <span className="text-[26px] font-medium text-black">Hodleague</span>
        </div>
        {/* Кнопка закрытия для мобильных */}
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <svg
            className="w-6 h-6 text-black"
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
      
      {/* Navigation */}
      <nav className="flex-1 px-4 pt-10">
        <ul className="space-y-0">
          {/* Tournament */}
          <li>
            <Link
              href="/tournament"
              className={`flex items-center gap-[5px] px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isTournamentActive
                  ? "bg-white text-black"
                  : "text-black/50 hover:text-black"
              }`}
            >
              {/* Tournament icon */}
              <TournamentIcon 
                width={16} 
                height={16} 
                strokeColor={tournamentIconColor}
                strokeOpacity={1}
              />
              <span className="text-[16px]">Tournament</span>
              {hasOpenTournament && (
                <span className="ml-auto px-2.5 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[#BAFFD9] text-black">
                  OPENED
                </span>
              )}
            </Link>
          </li>
          
          {/* Leaderboard */}
          <li>
            <Link
              href="/leaderboard"
              className={`flex items-center gap-[5px] px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isLeaderboardActive
                  ? "bg-white text-black"
                  : "text-black/50 hover:text-black"
              }`}
            >
              {/* Leaderboard icon */}
              <LeaderboardIcon 
                width={16} 
                height={16} 
                strokeColor={leaderboardIconColor}
                strokeOpacity={1}
              />
              <span className="text-[16px]">Leaderboard</span>
            </Link>
          </li>
          
          {/* Packs */}
          <li>
            <Link
              href="/packs"
              className={`flex items-center gap-[5px] px-4 py-2 h-12 rounded-[30px] transition-colors ${
                isPacksActive
                  ? "bg-white text-black"
                  : "text-black/50 hover:text-black"
              }`}
            >
              {/* Packs icon */}
              <PacksIcon 
                width={16} 
                height={16} 
                strokeColor={packsIconColor}
                strokeOpacity={isPacksActive ? 1 : 0.5}
              />
              <span className="text-[16px]">Packs</span>
              {availablePacks > 0 && (
                <span 
                  className="ml-auto flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'rgba(222, 94, 87, 1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.44)',
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
      <UserInfo />
    </aside>
  );
}
