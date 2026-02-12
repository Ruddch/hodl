"use client";

import type { UserProfileResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

interface UserAvatarProps {
  profile: UserProfileResponse;
}

export function UserAvatar({ profile }: UserAvatarProps) {
  // Используем nickname если есть, иначе генерируем имя из адреса кошелька
  const displayName = profile.nickname
    ? profile.nickname
    : profile.wallet_address
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : "User";

  return (
    <div className="relative z-10 ml-4 flex items-end gap-4 -mt-12 mb-4 sm:mb-8">
      {/* Аватар */}
      <Avatar 
        walletAddress={profile.wallet_address} 
        size={96} 
        border={true}
        borderColor="white"
        avatarUrl={profile.avatar_url}
      />
      
      {/* Имя пользователя */}
      <h1 className="text-2xl mb-2 font-semibold text-black">{displayName}</h1>
    </div>
  );
}
