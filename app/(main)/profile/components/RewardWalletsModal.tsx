"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BlurCard } from "@/components/BlurCard";
import {
  useRewardWallets,
  useAddRewardWallet,
  useUpdateRewardWallet,
  useDeleteRewardWallet,
} from "@/lib/api";
import { validateRewardWalletAddress } from "@/lib/reward-wallet";
import type { RewardWalletItem } from "@/lib/types";

const DEFAULT_MAX_WALLETS = 5;

interface RewardWalletsModalProps {
  open: boolean;
  onClose: () => void;
  primaryWallet: string;
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ClearIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface WalletRowProps {
  wallet: RewardWalletItem;
  primaryWallet: string;
  existingWallets: RewardWalletItem[];
  isBusy: boolean;
  onDelete: (id: number) => void;
}

function WalletRow({ wallet, primaryWallet, existingWallets, isBusy, onDelete }: WalletRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(wallet.wallet_address);
  const [error, setError] = useState<string | null>(null);
  const updateWallet = useUpdateRewardWallet();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const skipBlurRef = useRef(false);

  const cancelEdit = useCallback(() => {
    setDraft(wallet.wallet_address);
    setError(null);
    setEditing(false);
  }, [wallet.wallet_address]);

  const saveEdit = useCallback(async () => {
    if (!editing) return;

    const trimmed = draft.trim();
    if (trimmed.toLowerCase() === wallet.wallet_address.toLowerCase()) {
      cancelEdit();
      return;
    }

    const result = validateRewardWalletAddress(draft, {
      primaryWallet,
      existingWallets,
      excludeId: wallet.id,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError(null);
    try {
      await updateWallet.mutateAsync({ id: wallet.id, wallet_address: result.address });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [
    cancelEdit,
    draft,
    editing,
    existingWallets,
    primaryWallet,
    updateWallet,
    wallet.id,
    wallet.wallet_address,
  ]);

  const handleBlur = async () => {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    await saveEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      skipBlurRef.current = true;
      void saveEdit();
      inputRef.current?.blur();
    }
  };

  const rowBusy = isBusy || updateWallet.isPending;

  if (editing) {
    return (
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setError(null);
            setDraft(e.target.value);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={rowBusy}
          className="w-full rounded-[15px] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/35 disabled:opacity-50"
          spellCheck={false}
        />
        {error && <p className="text-sm font-medium text-[var(--badge-error-text)]">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <button
        type="button"
        onClick={() => {
          setDraft(wallet.wallet_address);
          setError(null);
          setEditing(true);
        }}
        disabled={rowBusy}
        className="flex-1 min-w-0 text-left text-sm font-mono text-[var(--text-primary)] truncate py-3 px-4 rounded-[15px] border border-[var(--border-subtle)] bg-[var(--input-bg)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={wallet.wallet_address}
        data-ph-capture-attribute-button="reward-wallet-edit"
      >
        {wallet.wallet_address}
      </button>
      <button
        type="button"
        onClick={() => onDelete(wallet.id)}
        disabled={rowBusy}
        className="shrink-0 p-2.5 rounded-[15px] text-[var(--text-muted)] hover:text-[var(--badge-error-text)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Delete wallet"
        data-ph-capture-attribute-button="reward-wallet-delete"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export function RewardWalletsModal({ open, onClose, primaryWallet }: RewardWalletsModalProps) {
  const { data, isLoading } = useRewardWallets(open);
  const addWallet = useAddRewardWallet();
  const deleteWallet = useDeleteRewardWallet();

  const [addDraft, setAddDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const skipAddBlurRef = useRef(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const wallets = data?.wallets ?? [];
  const total = data?.total ?? wallets.length;
  const maxWallets = data?.max_wallets ?? DEFAULT_MAX_WALLETS;
  const canAdd = total < maxWallets;

  const isPending =
    addWallet.isPending || deleteWallet.isPending;

  useEffect(() => {
    if (!open) {
      setAddDraft("");
      setAddError(null);
    }
  }, [open]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const saveAdd = useCallback(async () => {
    const trimmed = addDraft.trim();
    if (!trimmed) {
      setAddError(null);
      return;
    }

    const result = validateRewardWalletAddress(trimmed, {
      primaryWallet,
      existingWallets: wallets,
    });
    if (!result.ok) {
      setAddError(result.error);
      return;
    }

    setAddError(null);
    try {
      await addWallet.mutateAsync(result.address);
      setAddDraft("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong");
    }
  }, [addDraft, addWallet, primaryWallet, wallets]);

  const handleAddBlur = async () => {
    if (skipAddBlurRef.current) {
      skipAddBlurRef.current = false;
      return;
    }
    await saveAdd();
  };

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      skipAddBlurRef.current = true;
      void saveAdd();
      addInputRef.current?.blur();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteWallet.mutateAsync(id);
    } catch {
      // errors surface via mutation state if needed
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center mb-0">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={handleClose}
      />
      <div
        className="relative bg-[var(--surface)] w-full max-w-[420px] overflow-hidden mx-4 rounded-[30px] border border-[var(--border-subtle)] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <BlurCard
          blurValue={90}
          bgLayerAlignX="right"
          bgLayerWidthPercent={30}
          backgroundColor="rgba(255, 167, 117, 1)"
          className="flex flex-col min-h-0"
        >
          <div className="relative px-6 pt-10 pb-6 md:px-8 md:pb-8 flex flex-col min-h-0 overflow-y-auto">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-50"
              aria-label="Close"
              data-ph-capture-attribute-button="reward-wallets-modal-close"
            >
              <ClearIcon className="w-6 h-6" />
            </button>

            <h2 className="mb-1 pr-8 text-left text-xl md:text-2xl font-semibold leading-tight text-[var(--text-primary)]">
              Additional wallets
            </h2>
            <p className="mb-5 text-sm text-[var(--text-muted)]">
              {total} of {maxWallets}
            </p>

            {isLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading…</p>
            ) : (
              <div className="space-y-3">
                {canAdd && (
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        ref={addInputRef}
                        type="text"
                        value={addDraft}
                        onChange={(e) => {
                          setAddError(null);
                          setAddDraft(e.target.value);
                        }}
                        onBlur={handleAddBlur}
                        onKeyDown={handleAddKeyDown}
                        disabled={isPending}
                        placeholder="Paste wallet address"
                        className="w-full rounded-[15px] border border-[var(--input-border)] bg-[var(--input-bg)] pl-4 pr-10 py-3.5 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/35 disabled:opacity-50"
                        spellCheck={false}
                        data-ph-capture-attribute-input="reward-wallet-add"
                      />
                      {addDraft && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setAddDraft("");
                            setAddError(null);
                          }}
                          disabled={isPending}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50"
                          aria-label="Clear input"
                          data-ph-capture-attribute-button="reward-wallet-add-clear"
                        >
                          <ClearIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {addError && (
                      <p className="text-sm font-medium text-[var(--badge-error-text)]">{addError}</p>
                    )}
                  </div>
                )}

                {wallets.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    primaryWallet={primaryWallet}
                    existingWallets={wallets}
                    isBusy={isPending}
                    onDelete={handleDelete}
                  />
                ))}

                {!canAdd && (
                  <p className="text-sm text-[var(--text-muted)] pt-1">
                    Maximum of {maxWallets} wallets reached
                  </p>
                )}
              </div>
            )}
          </div>
        </BlurCard>
      </div>
    </div>
  );
}
