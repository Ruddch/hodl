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
    <div className="relative z-10 ml-4 mr-4 flex items-end gap-4 -mt-12 mb-4 sm:mb-8 w-full max-w-[calc(100%-16px)] overflow-hidden min-w-0">
      {/* Аватар */}
      <Avatar 
        walletAddress={profile.wallet_address} 
        size={96} 
        border={true}
        borderColor="var(--profile-avatar-border)"
        avatarUrl={profile.avatar_url}
      />
      
      {/* Имя и реферальная ссылка */}
      <div className="flex flex-row items-center gap-0 flex-wrap min-w-0 flex-1">
        <h1 className="text-xl mr-2 md:text-2xl font-semibold text-[var(--text-primary)] truncate min-w-0 max-w-[100%]" title={displayName}>
          {displayName}
        </h1>
        {profile.referral_link && (
          <button
            type="button"
            onClick={handleCopyRefLink}
            title="Copy ref link"
            className="flex cursor-pointer items-center gap-1 md:gap-2 px-0 py-0 md:px-2 md:py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
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
