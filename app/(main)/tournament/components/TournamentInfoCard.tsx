"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { useAuth } from "@/lib/auth-context";
import { SignInButton } from "@/components/SignInButton";
import type { Tournament } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function getTimeRemaining(endDate: string, currentTime?: number) {
  const end = new Date(endDate).getTime();
  const now = currentTime ?? Date.now();
  const diff = end - now;

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}

interface TournamentInfoCardProps {
  tournament: Tournament;
  onRegisterClick?: () => void;
}

export function TournamentInfoCard({ tournament, onRegisterClick }: TournamentInfoCardProps) {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const canRegister = tournament.status === "registration" && !tournament.is_registered;
  
  // Обновляем таймер каждую минуту
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // 60000 мс = 1 минута

    return () => clearInterval(interval);
  }, []);

  const timeRemaining =
    tournament.status === "registration" && tournament.gameplay_start_date && tournament.gameplay_start_date !== ""
      ? getTimeRemaining(tournament.gameplay_start_date, currentTime)
      : tournament.status === "ongoing"
      ? getTimeRemaining(tournament.end_date, currentTime)
      : null;

  const tournamentName = useMemo(() => {
    if (tournament.id === 16) return "ZeroToHero Special";
    const date = new Date(tournament.start_date);
    const month = date.toLocaleString("en-US", { month: "long" });
    return `${month.charAt(0).toUpperCase() + month.slice(1)} fire`;
  }, [tournament.start_date]);

  const prizePoolDisplay = useMemo(() => {
    if (!tournament.estimated_final_prize_pools) return "—";
    const firstPoolKey = Object.keys(tournament.estimated_final_prize_pools)[0];
    if (!firstPoolKey) return "—";
    const prizeInfo = tournament.estimated_final_prize_pools[firstPoolKey];
    const amount = parseFloat(prizeInfo.amount);
    const formattedAmount = new Intl.NumberFormat("en-US").format(amount);
    
    return `${formattedAmount} ${prizeInfo.currency_name}`;
  }, [tournament.estimated_final_prize_pools]);

  const statusText = 
  canRegister && tournament.gameplay_start_date
    ? ""
    : tournament.status === "registration" 
    ? "Tournament will start in" 
    : tournament.status === "ongoing" 
    ? "Tournament ends in" 
    : "";

  return (
    <div 
      data-onboarding="tournament-card"
      className="relative rounded-[16px] overflow-hidden border border-[var(--border-subtle)]"
      style={{
        boxShadow: "var(--tournament-card-shadow)"
      }}
    >
      {/* Background layers */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: "var(--tournament-card-bg)"
        }}
      />
      <div 
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ 
          background: "var(--tournament-card-overlay1)"
        }}
      />
      <div 
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ 
          background: "var(--tournament-card-overlay2)"
        }}
      />
      {/* Background image справа — на мобилке уже, чтобы данные помещались в левой половине */}
      <div className="absolute right-0 top-0 bottom-0 w-[35%] sm:w-[50%] overflow-hidden rounded-r-[16px]" style={{ background: tournament.id === 16 ? `#03A9F4` : `var(--tournament-card-accent)` }}>
        <div className="absolute inset-0 z-10" style={{ background: `linear-gradient(to left, transparent, transparent 50%, var(--tournament-card-accent))` }} />
        <Image 
          src={tournament.id === 16 ? "/pb.png" : "https://cdn.hodleague.com/card_templates/tournament_classic_common_20260425_131412.png"}
          alt="Tournament background"
          fill
          className={tournament.id === 16 ? "object-contain object-center" : "object-cover object-right"}
        />
      </div>
      {/* Content */}
      <div className="relative px-4 py-5 sm:px-9 sm:py-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
          <h2 className="text-xl sm:text-[32px] font-semibold leading-tight sm:leading-8 text-[var(--text-primary)]">{tournamentName}</h2>
          <StatusBadge status={tournament.status} />
        </div>

        <div className="flex gap-6 sm:gap-28 mb-4 sm:mb-6">
          <div>
            <p className="text-xs sm:text-base text-[var(--text-secondary)] leading-6 sm:leading-8">Weekly prize</p>
            <p className="text-xl sm:text-[36px] font-semibold leading-tight sm:leading-8 text-[var(--text-primary)] mt-0.5 sm:mt-2">
              {prizePoolDisplay}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-base text-[var(--text-secondary)] leading-6 sm:leading-8">Members</p>
            <p className="text-xl sm:text-[36px] font-semibold leading-tight sm:leading-8 text-[var(--text-primary)] mt-0.5 sm:mt-2">
              {tournament.participants_count}
            </p>
          </div>
        </div>

        {/* Кнопка Register или Connect Wallet или таймер в зависимости от состояния */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {canRegister && (
            <>
              {!isConnected ? (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      onClick={show}
                      className="cursor-pointer px-6 sm:px-17 py-2.5 sm:py-3 bg-[var(--primary)] hover:opacity-90 text-white text-sm sm:text-base font-medium rounded-[15px] transition-colors"
                      data-ph-capture-attribute-button="tournament-connect-wallet"
                      style={{
                        boxShadow: "0px 4px 12px 0px rgba(99, 102, 241, 0.35), 0px 2px 4px 0px rgba(99, 102, 241, 0.2)"
                      }}
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              ) : !isAuthenticated ? (
                <SignInButton variant="tournament" data-ph-capture-attribute-button="tournament-sign-in" />
              ) : onRegisterClick ? (
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="cursor-pointer px-6 sm:px-17 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary)] text-white text-sm sm:text-base font-medium rounded-[15px] transition-colors"
                  data-ph-capture-attribute-button="tournament-register"
                  style={{
                    boxShadow: "0px 4px 12px 0px rgba(99, 102, 241, 0.35), 0px 2px 4px 0px rgba(99, 102, 241, 0.2)"
                  }}
                >
                  Register
                </button>
              ) : null}
            </>
          )}

          {/* Таймер показывается всегда когда турнир в статусе registration */}
          {tournament.status === "registration" && timeRemaining && (
            <p className="text-sm sm:text-base font-medium text-[var(--text-primary)]">
              {statusText}{" "}
              <span>{timeRemaining.days}d</span> : <span>{timeRemaining.hours}h</span> : <span>{timeRemaining.minutes}</span>m
            </p>
          )}

          {/* Таймер для ongoing турнира */}
          {tournament.status === "ongoing" && timeRemaining && (
            <p className="text-sm sm:text-base font-medium text-[var(--text-primary)]">
              {statusText}{" "}
              <span>{timeRemaining.days}d</span> : <span>{timeRemaining.hours}h</span> : <span>{timeRemaining.minutes}</span>m
            </p>
          )}
        </div>
      </div>
    </div>
  );
}