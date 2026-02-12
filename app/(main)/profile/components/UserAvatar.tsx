"use client";

import { useState } from "react";
import type { UserProfileResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { CopyIcon, CheckIcon } from "@/components/Icons";

interface UserAvatarProps {
  profile: UserProfileResponse;
}

export function UserAvatar({ profile }: UserAvatarProps) {
  const [copied, setCopied] = useState(false);

  const displayName = profile.nickname
    ? profile.nickname
    : profile.wallet_address
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : "User";

  const handleCopyRefLink = async () => {
    const link = profile.referral_link;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

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
      
      {/* Имя и реферальная ссылка */}
      <div className="flex flex-row items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-black">{displayName}</h1>
        {profile.referral_link && (
          <button
            type="button"
            onClick={handleCopyRefLink}
            title="Copy ref link"
            className="flex cursor-pointer items-center gap-1 md:gap-2 px-2 py-1.5 text-sm text-black/70 hover:text-black hover:bg-black/5 rounded-lg transition-colors"
          >
            <span>{copied ? "Copied!" : "Referral link"}</span>
            {copied ? (
              <CheckIcon width={16} height={16} className="text-green-600 shrink-0" />
            ) : (
              <CopyIcon width={16} height={16} className="shrink-0" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
