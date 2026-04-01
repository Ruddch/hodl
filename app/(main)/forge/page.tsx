"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { BlurCard } from "@/components/BlurCard";
import { ForgeCardSelectModal } from "@/components/ForgeCardSelectModal";
import { Toast } from "@/components/Toast";
import { ForgeInputsInitial } from "@/components/forge/ForgeInputsInitial";
import { ForgeInputsCommonBurn } from "@/components/forge/ForgeInputsCommonBurn";
import { ForgeInputsNonCommonSwap } from "@/components/forge/ForgeInputsNonCommonSwap";
import type { UserCard } from "@/lib/types";
import { useCardBurn } from "@/lib/hooks/useCardBurn";
import {
  getForgeSwapRecipeForCard,
  isCommonRarity,
  FORGE_COMMON_BURN_DUST_REWARD,
} from "@/lib/forge";
import { loadImageForCanvas } from "@/lib/loadImageForCanvas";

function cardTextureUrl(card: UserCard): string {
  return card.rendered_image_url || card.token_image_url || "/packs.png";
}

function effectiveChainId(card: UserCard, walletChainId: number | undefined): number | undefined {
  return card.chain_id ?? walletChainId;
}

export default function ForgePage() {
  const { chainId: currentChainId } = useAccount();
  /** Выбранные карты по порядку слотов; первая задаёт режим common / non-common */
  const [forgeCards, setForgeCards] = useState<UserCard[]>([]);
  const [pickingSlotIndex, setPickingSlotIndex] = useState(0);
  const [pickOpen, setPickOpen] = useState(false);
  const [burnPlaying, setBurnPlaying] = useState(false);
  const [burnOverlayReady, setBurnOverlayReady] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message?: string;
    variant?: "success" | "error";
  }>({ visible: false });

  const firstCard = forgeCards[0] ?? null;

  const onBurnSuccess = useCallback(() => {
    setBurnOverlayReady(false);
    setBurnPlaying(true);
  }, []);

  const onBurnError = useCallback((_err: Error) => {
    setToast({
      visible: true,
      variant: "error",
      message: _err.message,
    });
  }, []);

  const { burnCards, isLoading: burnTxLoading, reset: resetBurn } = useCardBurn({
    onSuccess: onBurnSuccess,
    onError: onBurnError,
  });

  const recipe = useMemo(
    () => (firstCard ? getForgeSwapRecipeForCard(firstCard) : null),
    [firstCard]
  );

  const canBurnCommon = useMemo(() => {
    if (forgeCards.length === 0 || !recipe || recipe.slots !== 1 || !isCommonRarity(forgeCards[0])) {
      return false;
    }
    const ref = effectiveChainId(forgeCards[0], currentChainId);
    if (ref == null) return false;
    return forgeCards.every(
      (c) => isCommonRarity(c) && effectiveChainId(c, currentChainId) === ref
    );
  }, [forgeCards, recipe, currentChainId]);

  const openPickerForSlot = useCallback((slotIndex: number) => {
    setPickingSlotIndex(slotIndex);
    setPickOpen(true);
  }, []);

  const clearAll = useCallback(() => {
    setForgeCards([]);
  }, []);

  const clearSlot = useCallback((index: number) => {
    setForgeCards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectCard = useCallback(
    (card: UserCard) => {
      setForgeCards((prev) => {
        if (pickingSlotIndex < prev.length) {
          const next = [...prev];
          next[pickingSlotIndex] = card;
          return next;
        }
        return [...prev, card];
      });
    },
    [pickingSlotIndex]
  );

  const handleBurnAnimationComplete = useCallback(() => {
    setBurnPlaying(false);
    setBurnOverlayReady(false);
    clearAll();
    resetBurn();
    const n = forgeCards.length;
    setToast({
      visible: true,
      variant: "success",
      message: `You received ${FORGE_COMMON_BURN_DUST_REWARD * n} dust.`,
    });
  }, [clearAll, resetBurn, forgeCards.length]);

  const handleBurn = useCallback(async () => {
    if (!canBurnCommon || forgeCards.length === 0) return;
    const chainId = effectiveChainId(forgeCards[0], currentChainId);
    if (chainId == null) {
      setToast({
        visible: true,
        variant: "error",
        message:
          "Could not determine the card network. Connect your wallet or ensure the card has chain information.",
      });
      return;
    }
    await burnCards({
      user_card_ids: forgeCards.map((c) => c.user_card_id),
      chain_id: chainId,
    });
  }, [canBurnCommon, forgeCards, currentChainId, burnCards]);

  const forgeImageCacheBust = firstCard?.user_card_id ?? 0;

  useEffect(() => {
    if (!firstCard) return;
    loadImageForCanvas(cardTextureUrl(firstCard), { bust: forgeImageCacheBust }).catch(() => {});
  }, [firstCard, forgeImageCacheBust]);

  const showCommon = Boolean(firstCard && isCommonRarity(firstCard));
  const showNonCommon = Boolean(firstCard && !isCommonRarity(firstCard));

  const modalCommonOnly = Boolean(forgeCards.length > 0 && firstCard && isCommonRarity(firstCard));
  const modalMatchChainId =
    modalCommonOnly && firstCard ? effectiveChainId(firstCard, currentChainId) : undefined;

  const modalExcludeIds = useMemo(
    () => forgeCards.filter((_, i) => i !== pickingSlotIndex).map((c) => c.user_card_id),
    [forgeCards, pickingSlotIndex]
  );

  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <BlurCard backgroundColor="rgb(255, 196, 168)" className="flex-1 min-h-0 flex flex-col min-w-0">
        <div className="flex flex-col gap-5 px-4 sm:px-6 pt-4 md:pt-6 pb-6 md:pb-8 flex-shrink-0 w-full text-left items-stretch">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold leading-8 text-[var(--text-primary)]">Forge</h2>
          </div>

          <div className="flex flex-wrap gap-[1px] rounded-[16px] p-2 w-fit bg-[var(--input-bg)]">
            <button
              type="button"
              aria-current="page"
              data-ph-capture-attribute-button="forge-tab-swap"
              className="p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] shadow-[0_1px_1px_0_rgba(0,0,0,0.09),_0_1px_1px_0_rgba(0,0,0,0.05),_0_2px_1px_0_rgba(0,0,0,0.01)]"
            >
              Swap
            </button>
            <button
              type="button"
              disabled
              aria-disabled
              data-ph-capture-attribute-button="forge-tab-upgrade"
              className="p-2 sm:p-[12px] rounded-[10px] text-[14px] sm:text-[16px] font-normal leading-none tracking-normal text-center flex items-center gap-2 opacity-60 cursor-not-allowed text-[var(--text-muted)]"
            >
              <span>Upgrade</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                soon
              </span>
            </button>
          </div>

          <div className="w-full min-w-0">
            {forgeCards.length === 0 && (
              <ForgeInputsInitial onOpenPicker={() => openPickerForSlot(0)} />
            )}

            {showCommon && firstCard && (
              <ForgeInputsCommonBurn
                cards={forgeCards}
                forgeImageCacheBust={forgeImageCacheBust}
                burnPlaying={burnPlaying}
                burnOverlayReady={burnOverlayReady}
                burnTxLoading={burnTxLoading}
                canBurn={canBurnCommon}
                onOpenSlot={openPickerForSlot}
                onClearSlot={clearSlot}
                onResetAll={clearAll}
                onBurn={handleBurn}
                onBurnVisualReady={() => setBurnOverlayReady(true)}
                onBurnAnimationComplete={handleBurnAnimationComplete}
              />
            )}

            {showNonCommon && firstCard && (
              <ForgeInputsNonCommonSwap card={firstCard} onOpenPicker={() => openPickerForSlot(0)} onClear={clearAll} />
            )}
          </div>
        </div>
      </BlurCard>

      <ForgeCardSelectModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onSelect={handleSelectCard}
        excludeUserCardIds={modalExcludeIds}
        commonOnly={modalCommonOnly}
        matchChainId={modalMatchChainId}
        walletChainId={currentChainId}
        title="Placeholder title"
        subtitle="Placeholder subtitle."
      />

      <Toast
        visible={toast.visible}
        variant={toast.variant ?? "success"}
        message={toast.message}
        onDismiss={() => setToast({ visible: false })}
      />
    </div>
  );
}
