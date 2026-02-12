"use client";

import type { UserProfileResponse } from "@/lib/types";
import { formatBalance } from "@/lib/balance";

interface StatsCardsProps {
  profile: UserProfileResponse;
}

export function StatsCards({ profile }: StatsCardsProps) {
  const statsData = profile.stats;

  const formatBestPosition = (position: number) => {
    if (position === 0) return "—";
    const suffix = position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th";
    return `${position}${suffix} place`;
  };

  const stats = {
    balance: formatBalance(statsData?.balances),
    bestScore: statsData?.best_score ? statsData.best_score.toLocaleString() : "0",
    cards: statsData?.total_cards ?? 0,
    bestResult: {
      place: statsData?.best_position ? formatBestPosition(statsData.best_position) : "—",
    },
    tournaments: statsData?.tournaments_participated ?? 0,
    refCount: profile.referral_count ?? 0,
  };

  return (
    <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8">
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
      {/* Balance */}
      <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Balance</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.65" y="4.65" width="22.7" height="14.7" rx="4.35" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <circle cx="12" cy="12" r="3.35" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <circle cx="5" cy="9" r="1" fill="black" fillOpacity="0.5"/>
              <circle cx="19" cy="9" r="1" fill="black" fillOpacity="0.5"/>
              <circle cx="5" cy="15" r="1" fill="black" fillOpacity="0.5"/>
              <circle cx="19" cy="15" r="1" fill="black" fillOpacity="0.5"/>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black">{stats.balance}</p>
      </div>

      {/* Best score */}
      <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Best score</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.3496 14.6504V20.3818C15.3496 20.6419 15.0764 20.8113 14.8438 20.6953L13.1855 19.8662C12.4395 19.4932 11.5605 19.4932 10.8145 19.8662L9.15625 20.6953C8.92361 20.8113 8.65039 20.6419 8.65039 20.3818V14.6504H15.3496Z" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <circle cx="12" cy="9" r="7" fill="#F7F7F7"/>
              <circle cx="12" cy="9" r="6.35" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <path d="M11.7147 6.87812C11.8045 6.60172 12.1955 6.60172 12.2853 6.87812L12.6062 7.86565C12.6464 7.98926 12.7615 8.07295 12.8915 8.07295H13.9299C14.2205 8.07295 14.3413 8.44483 14.1062 8.61565L13.2661 9.22599C13.161 9.30238 13.117 9.43779 13.1572 9.5614L13.478 10.5489C13.5678 10.8253 13.2515 11.0552 13.0164 10.8843L12.1763 10.274C12.0712 10.1976 11.9288 10.1976 11.8237 10.274L10.9836 10.8843C10.7485 11.0552 10.4322 10.8253 10.522 10.5489L10.8428 9.5614C10.883 9.43779 10.839 9.30238 10.7339 9.22599L9.8938 8.61565C9.65869 8.44483 9.77952 8.07295 10.0701 8.07295H11.1085C11.2385 8.07295 11.3536 7.98926 11.3938 7.86565L11.7147 6.87812Z" fill="black" fillOpacity="0.5"/>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black">{stats.bestScore}</p>
      </div>

      {/* Cards */}
      <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Cards</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="8" width="9" height="12" rx="2" transform="rotate(-14 1 8)" fill="#F7F7F7"/>
              <rect x="1.78794" y="8.47344" width="7.7" height="10.7" rx="1.35" transform="rotate(-14 1.78794 8.47344)" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <rect x="8" y="5" width="9" height="12" rx="2" fill="#F7F7F7"/>
              <rect x="8.65" y="5.65" width="7.7" height="10.7" rx="1.35" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <rect x="14.9028" y="6" width="9" height="12" rx="2" transform="rotate(14 14.9028 6)" fill="#F7F7F7"/>
              <rect x="15.3763" y="6.78794" width="7.7" height="10.7" rx="1.35" transform="rotate(14 15.3763 6.78794)" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black">{stats.cards}</p>
      </div>

      {/* Best result */}
      <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Best result</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="path-1-inside-1_175_15846" fill="white">
                <rect x="2.875" y="11.375" width="5.625" height="5.625" rx="1.125"/>
              </mask>
              <rect x="2.875" y="11.375" width="5.625" height="5.625" rx="1.125" stroke="black" strokeOpacity="0.5" strokeWidth="2.66" mask="url(#path-1-inside-1_175_15846)"/>
              <mask id="path-2-inside-2_175_15846" fill="white">
                <rect x="16.375" y="13.625" width="5.625" height="3.375" rx="1.125"/>
              </mask>
              <rect x="16.375" y="13.625" width="5.625" height="3.375" rx="1.125" stroke="black" strokeOpacity="0.5" strokeWidth="2.66" mask="url(#path-2-inside-2_175_15846)"/>
              <mask id="path-3-inside-3_175_15846" fill="white">
                <rect x="9.625" y="8" width="5.625" height="9" rx="1.125"/>
              </mask>
              <rect x="9.625" y="8" width="5.625" height="9" rx="1.125" stroke="black" strokeOpacity="0.5" strokeWidth="2.66" mask="url(#path-3-inside-3_175_15846)"/>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black truncate" title={stats.bestResult.place}>{stats.bestResult.place}</p>
        {/* <p className="text-sm text-black/50">{stats.bestResult.date}</p> */}
      </div>

      {/* Tournaments */}
        <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Tournaments</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_175_15857)">
                <path d="M5.39868 11.2378L6.37475 14.8805M6.37475 14.8805L10.0175 13.9044M6.37475 14.8805L11.7081 5.6429M18.4577 12.619L17.4816 8.97624M17.4816 8.97624L13.8389 9.9523M17.4816 8.97624L12.1483 18.2138" stroke="black" strokeOpacity="0.5" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_175_15857">
                  <rect width="16" height="16" fill="white" transform="translate(9 1) rotate(30)"/>
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black">{stats.tournaments}</p>
      </div>

      {/* Ref count */}
      <div className="bg-[#F2F2F2] rounded-[12px] sm:rounded-[16px] p-2 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] sm:text-[16px] font-normal text-black/50">Referrals</h3>
          <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="black" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="black" strokeOpacity="0.5" strokeWidth="1.3"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="black" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <p className="text-[16px] sm:text-[24px] font-semibold text-black">{stats.refCount}</p>
      </div>
    </div>
    </div>
  );
}
