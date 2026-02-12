"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
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
      className="relative rounded-[16px] overflow-hidden border border-white/10"
      style={{
        boxShadow: "34px 243px 69px 0px rgba(214,214,214,0), 22px 156px 63px 0px rgba(214,214,214,0.01), 12px 88px 53px 0px rgba(214,214,214,0.05), 6px 39px 39px 0px rgba(214,214,214,0.09), 1px 10px 22px 0px rgba(214,214,214,0.1)"
      }}
    >
      {/* Background layers */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: "linear-gradient(112deg, rgba(211, 247, 255, 1) 57.8%, rgba(21, 0, 211, 1) 168.7%)" 
        }}
      />
      <div 
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ 
          background: "linear-gradient(108deg, rgba(78, 106, 255, 0.06) 22.4%, rgba(21, 0, 211, 0.06) 104.7%)" 
        }}
      />
      <div 
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ 
          background: "linear-gradient(107deg, rgba(208, 203, 255, 0.06) 60.8%, rgba(21, 0, 211, 0.06) 227.6%)" 
        }}
      />
      {/* Background image справа — на мобилке уже, чтобы данные помещались в левой половине */}
      <div className="absolute right-0 top-0 bottom-0 w-[35%] sm:w-[50%] overflow-hidden rounded-r-[16px]">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[rgba(202, 233, 254, 0.8)] z-10" />
        <Image 
          src={"https://back.hodleague.com/static/card_templates/tournament_background_classic_common_20260120_215329.png"}
          alt="Tournament background"
          fill
          className="object-cover object-right"
        />
      </div>
      {/* Content */}
      <div className="relative px-4 py-5 sm:px-9 sm:py-10">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
          <h2 className="text-xl sm:text-[32px] font-semibold leading-tight sm:leading-8 text-black">{tournamentName}</h2>
          <StatusBadge status={tournament.status} />
        </div>

        <div className="flex gap-6 sm:gap-28 mb-4 sm:mb-6">
          <div>
            <p className="text-xs sm:text-base text-black/50 leading-6 sm:leading-8">Weekly prize</p>
            <p className="text-xl sm:text-[36px] font-semibold leading-tight sm:leading-8 text-black mt-0.5 sm:mt-2">
              {prizePoolDisplay}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-base text-black/50 leading-6 sm:leading-8">Members</p>
            <p className="text-xl sm:text-[36px] font-semibold leading-tight sm:leading-8 text-black mt-0.5 sm:mt-2">
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
                      className="cursor-pointer px-6 sm:px-17 py-2.5 sm:py-3 bg-[#2200EF] hover:opacity-90 text-white text-sm sm:text-base font-medium rounded-[15px] transition-colors"
                      style={{
                        boxShadow: "0px 4px 12px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)"
                      }}
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              ) : onRegisterClick ? (
                <button
                  onClick={onRegisterClick}
                  className="cursor-pointer px-6 sm:px-17 py-2.5 sm:py-3 bg-[#2200EF] hover:bg-[#2200EF] text-white text-sm sm:text-base font-medium rounded-[15px] transition-colors"
                  style={{
                    boxShadow: "0px 4px 12px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)"
                  }}
                >
                  Register
                </button>
              ) : null}
            </>
          )}

          {/* Таймер показывается всегда когда турнир в статусе registration */}
          {tournament.status === "registration" && timeRemaining && (
            <p className="text-sm sm:text-base font-medium text-black">
              {statusText}{" "}
              <span>{timeRemaining.days}d</span> : <span>{timeRemaining.hours}h</span> : <span>{timeRemaining.minutes}</span>m
            </p>
          )}

          {/* Таймер для ongoing турнира */}
          {tournament.status === "ongoing" && timeRemaining && (
            <p className="text-sm sm:text-base font-medium text-black">
              {statusText}{" "}
              <span>{timeRemaining.days}d</span> : <span>{timeRemaining.hours}h</span> : <span>{timeRemaining.minutes}</span>m
            </p>
          )}
        </div>
      </div>
    </div>
  );
}