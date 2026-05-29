"use client";

import { useState, useRef, useEffect } from "react";
import type { UserProfileResponse } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { BlurCard } from "@/components/BlurCard";
import { CopyIcon, CheckIcon } from "@/components/Icons";
import { useUpdateMyNickname } from "@/lib/api";
import { sanitizeNicknameInput, validateNickname } from "@/lib/nickname";
import type { ReactNode } from "react";

interface UserAvatarProps {
  profile: UserProfileResponse;
  showReferralLink?: boolean;
  /** Меню «⋯» (редактирование имени) — только для своего профиля */
  showProfileMenu?: boolean;
  /** Desktop-кнопка additional wallets (md+) */
  rewardWalletsTrigger?: ReactNode;
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

export function UserAvatar({
  profile,
  showReferralLink = true,
  showProfileMenu = false,
  rewardWalletsTrigger,
}: UserAvatarProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const updateNickname = useUpdateMyNickname();

  const displayName = profile.nickname
    ? profile.nickname
    : profile.wallet_address
    ? `${profile.wallet_address.slice(0, 6)}...${profile.wallet_address.slice(-4)}`
    : "User";

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", onDocMouseDown);
    }
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [menuOpen]);

  const openEditNickname = () => {
    setMenuOpen(false);
    setEditError(null);
    setNicknameDraft(sanitizeNicknameInput(profile.nickname ?? ""));
    setEditOpen(true);
  };

  const handleSaveNickname = async () => {
    const result = validateNickname(nicknameDraft);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    setEditError(null);
    try {
      await updateNickname.mutateAsync({ nickname: result.nickname });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

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
    <div className="relative z-10 ml-4 mr-4 flex items-end gap-2 md:gap-4 -mt-12 mb-4 sm:mb-8 w-full max-w-[calc(100%-16px)] min-w-0">
      <Avatar
        walletAddress={profile.wallet_address}
        size={96}
        border={true}
        borderColor="var(--profile-avatar-border)"
        avatarUrl={profile.avatar_url}
      />

      <div className="flex flex-row items-center gap-0 flex-wrap min-w-0 flex-1 md:flex-nowrap">
        <div className="flex flex-row items-center gap-0 flex-wrap min-w-0">
          <div className="flex items-center gap-0 min-w-0 max-w-full mr-2">
            <h1
              className="text-xl mr-1 md:text-2xl font-semibold text-[var(--text-primary)] truncate min-w-0"
              title={displayName}
            >
              {displayName}
            </h1>
            {showProfileMenu && (
              <div className="relative shrink-0" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Profile actions"
                  data-ph-capture-attribute-button="profile-actions-menu"
                >
                  <MoreVerticalIcon />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute overflow-hidden top-full left-auto right-0 mt-1 z-[60] w-max min-w-[min(200px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg md:left-0 md:right-auto"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openEditNickname}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      data-ph-capture-attribute-button="profile-edit-username"
                    >
                      <PencilIcon className="text-[var(--text-muted)] shrink-0" />
                      Edit username
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {showReferralLink && profile.referral_link && (
            <button
              type="button"
              onClick={handleCopyRefLink}
              data-ph-capture-attribute-button="copy-referral-link"
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
        {rewardWalletsTrigger}
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--overlay)" }}
            onClick={() => !updateNickname.isPending && setEditOpen(false)}
          />
          <div
            className="relative bg-[var(--surface)] w-full max-w-[420px] overflow-hidden mx-4 rounded-[30px] border border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <BlurCard
              blurValue={90}
              bgLayerAlignX="right"
              bgLayerWidthPercent={30}
              backgroundColor="rgba(255, 167, 117, 1)"
              className="flex flex-col"
            >
              <div className="relative px-6 pt-10 pb-6 md:px-8 md:pb-8 flex flex-col">
                <button
                  type="button"
                  onClick={() => !updateNickname.isPending && setEditOpen(false)}
                  className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                  aria-label="Close"
                  data-ph-capture-attribute-button="edit-nickname-modal-close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="mb-5 pr-8 text-left text-xl md:text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                  Edit your username
                </h2>
                <input
                  type="text"
                  value={nicknameDraft}
                  onChange={(e) => {
                    setEditError(null);
                    setNicknameDraft(sanitizeNicknameInput(e.target.value));
                  }}
                  className="w-full rounded-[15px] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3.5 text-base leading-snug text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/35"
                  placeholder="Username"
                  maxLength={30}
                  autoComplete="nickname"
                  spellCheck={false}
                  disabled={updateNickname.isPending}
                />
                {editError && (
                  <p className="mt-2 text-sm font-medium text-[var(--badge-error-text)]">{editError}</p>
                )}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    disabled={updateNickname.isPending}
                    className="cursor-pointer flex-1 py-4 px-6 text-center text-base font-medium rounded-[15px] bg-white text-[var(--primary)] border border-[var(--primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    data-ph-capture-attribute-button="edit-nickname-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    disabled={updateNickname.isPending}
                    className="cursor-pointer flex-1 py-4 px-6 text-center text-base font-semibold rounded-[15px] text-white bg-[var(--primary)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: "0px 2px 6px 0px rgba(74, 106, 255, 0.3)" }}
                    data-ph-capture-attribute-button="profile-save-nickname"
                  >
                    {updateNickname.isPending ? "Updating…" : "Update"}
                  </button>
                </div>
              </div>
            </BlurCard>
          </div>
        </div>
      )}
    </div>
  );
}
