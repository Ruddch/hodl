"use client";

interface RewardWalletsCountProps {
  total: number;
  max: number;
}

interface RewardWalletsDesktopTriggerProps extends RewardWalletsCountProps {
  onClick: () => void;
}

export function RewardWalletsDesktopTrigger({
  onClick,
  total,
  max,
}: RewardWalletsDesktopTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex md:ml-auto shrink-0 cursor-pointer items-center gap-1.5 px-2 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors whitespace-nowrap"
      data-ph-capture-attribute-button="open-reward-wallets"
    >
      <span>Additional wallets</span>
      <span className="text-[var(--text-muted)]">
        ({total} of {max})
      </span>
    </button>
  );
}

interface RewardWalletsMobileBarProps extends RewardWalletsCountProps {
  onClick: () => void;
}

export function RewardWalletsMobileBar({ onClick, total, max }: RewardWalletsMobileBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden w-full flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
      data-ph-capture-attribute-button="open-reward-wallets-mobile"
    >
      <span>Additional wallets</span>
      <span className="text-[var(--text-muted)] font-normal shrink-0">
        {total} of {max}
      </span>
    </button>
  );
}
