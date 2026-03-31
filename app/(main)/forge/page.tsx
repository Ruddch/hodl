"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { BlurCard } from "@/components/BlurCard";
import { ForgeCardSelectModal } from "@/components/ForgeCardSelectModal";
import { Toast } from "@/components/Toast";
import type { UserCard } from "@/lib/types";
import { CARD_ASPECT_RATIO } from "@/lib/constants";
import {
  getForgeSwapRecipeForCard,
  forgeSwapCanSubmit,
  isCommonRarity,
  FORGE_COMMON_BURN_DUST_REWARD,
  type ForgeSwapRecipe,
} from "@/lib/forge";
import { loadImageForCanvas } from "@/lib/loadImageForCanvas";

const CardBurnAnimation = dynamic(
  () => import("@/components/forge/CardBurnAnimation").then((m) => m.CardBurnAnimation),
  { ssr: false }
);

type PickSlot = "first" | "second";

function cardTextureUrl(card: UserCard): string {
  return card.rendered_image_url || card.token_image_url || "/packs.png";
}

/** Миниатюрный «+» между слотами — без круга, как разделитель в компактных craft-UI */
function SlotPlusDivider() {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-[var(--text-muted)] opacity-45"
      aria-hidden
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function ForgeSlotBox({
  filled,
  emptyLabel,
  onOpenPicker,
  onClear,
  clearLabel,
  /**
   * Карта выбрана, но показываем UI пустого слота (пунктир, без крестика) — например во время burn под WebGL.
   */
  visualEmpty = false,
}: {
  filled: UserCard | null;
  emptyLabel: string;
  onOpenPicker: () => void;
  onClear: () => void;
  clearLabel: string;
  visualEmpty?: boolean;
}) {
  const showFilledChrome = Boolean(filled) && !visualEmpty;

  return (
    <div
      className="relative w-[148px] sm:w-[168px] shrink-0"
      style={{ aspectRatio: `${CARD_ASPECT_RATIO}` }}
    >
      {showFilledChrome ? (
        <>
          <button
            type="button"
            onClick={onOpenPicker}
            className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-[var(--badge-purple-muted)] text-left cursor-pointer hover:ring-2 hover:ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)] transition-all"
            aria-label="Change card"
            data-ph-capture-attribute-button="forge-change-card"
          >
            <div className="relative w-full h-full">
              {filled!.rendered_image_url ? (
                <Image
                  src={filled!.rendered_image_url}
                  alt={filled!.token_name}
                  fill
                  className="object-cover"
                  sizes="168px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-hover)]">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{filled!.token_name}</span>
                  <span className="text-xs text-[var(--text-muted)] mt-1">{filled!.token_symbol}</span>
                </div>
              )}
            </div>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[var(--surface)] border border-[var(--border)] rounded-md flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors shadow-sm z-10"
            aria-label={clearLabel}
            data-ph-capture-attribute-button="forge-clear-card"
          >
            <svg className="w-3 h-3 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className="absolute inset-0 w-full h-full rounded-lg sm:rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--badge-purple-muted)]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-subtle)] transition-colors cursor-pointer"
          data-ph-capture-attribute-button="forge-open-card-picker"
        >
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[10px] sm:text-[11px] font-medium px-1 text-center leading-tight">{emptyLabel}</span>
        </button>
      )}
    </div>
  );
}

export default function ForgePage() {
  const [pickOpen, setPickOpen] = useState(false);
  const [pickSlot, setPickSlot] = useState<PickSlot>("first");
  const [firstCard, setFirstCard] = useState<UserCard | null>(null);
  const [secondCard, setSecondCard] = useState<UserCard | null>(null);
  const [burnPlaying, setBurnPlaying] = useState(false);
  /** Скрываем статичную карту только когда burn-canvas уже готов — без паузы «фиолетовый слот» */
  const [burnOverlayReady, setBurnOverlayReady] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message?: string }>({ visible: false });

  const recipe: ForgeSwapRecipe | null = useMemo(
    () => (firstCard ? getForgeSwapRecipeForCard(firstCard) : null),
    [firstCard]
  );

  const slotsForSubmit = useMemo<(UserCard | null)[]>(() => {
    if (!firstCard || !recipe) return [];
    if (recipe.slots === 2) return [firstCard, secondCard];
    return [firstCard];
  }, [firstCard, secondCard, recipe]);

  const canSubmit = recipe ? forgeSwapCanSubmit(recipe, slotsForSubmit) : false;

  const openPicker = useCallback((slot: PickSlot) => {
    setPickSlot(slot);
    setPickOpen(true);
  }, []);

  const clearAll = useCallback(() => {
    setFirstCard(null);
    setSecondCard(null);
  }, []);

  const clearSecondOnly = useCallback(() => {
    setSecondCard(null);
  }, []);

  const handleSelectCard = useCallback(
    (card: UserCard) => {
      if (pickSlot === "first") {
        setFirstCard(card);
        setSecondCard(null);
      } else {
        setSecondCard(card);
      }
    },
    [pickSlot]
  );

  const handleBurnAnimationComplete = useCallback(() => {
    setBurnPlaying(false);
    setBurnOverlayReady(false);
    clearAll();
    setToast({ visible: true, message: "Placeholder action feedback." });
  }, [clearAll]);

  const handlePrimary = useCallback(() => {
    if (firstCard && recipe?.slots === 1 && isCommonRarity(firstCard)) {
      setBurnOverlayReady(false);
      setBurnPlaying(true);
      return;
    }
    setToast({ visible: true, message: "Placeholder action feedback." });
  }, [firstCard, recipe]);

  const modalProps = useMemo(() => {
    if (pickSlot === "second" && firstCard) {
      return {
        sameCardIdAs: firstCard.card_id,
        excludeUserCardIds: [firstCard.user_card_id, ...(secondCard ? [secondCard.user_card_id] : [])],
        title: "Placeholder title",
        subtitle: "Placeholder subtitle.",
      };
    }
    return {
      title: "Placeholder title",
      subtitle: "Placeholder subtitle.",
    };
  }, [pickSlot, firstCard, secondCard]);

  const showTwoSlots = recipe?.slots === 2;

  /** Common + single slot: card left, copy right */
  const showCommonBurnAside =
    Boolean(firstCard && recipe?.slots === 1 && isCommonRarity(firstCard));

  /** Один cache-bust на выбор карты: тот же `t`, что при burn WebGL → тот же URL → HTTP-кэш */
  const forgeImageCacheBust = useMemo(() => Date.now(), [firstCard?.user_card_id]);

  /** Предзагрузка той же строки URL, что и `loadImageForCanvas` в CardBurnAnimation */
  useEffect(() => {
    if (!firstCard) return;
    loadImageForCanvas(cardTextureUrl(firstCard), { bust: forgeImageCacheBust }).catch(() => {});
  }, [firstCard, forgeImageCacheBust]);

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

          <div className="w-full max-w-2xl">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6 max-w-lg">
                Placeholder hint text. Rules for common vs rare slots will be explained here.
              </p>

              <div className="border-t border-[var(--border-subtle)] pt-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)] mb-4">
                  Inputs
                </p>

                {showCommonBurnAside ? (
                  <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
                    <div className="relative shrink-0 w-[148px] sm:w-[168px]">
                      <ForgeSlotBox
                        filled={firstCard}
                        emptyLabel="Slot 1"
                        onOpenPicker={() => openPicker("first")}
                        onClear={clearAll}
                        clearLabel="Clear forge"
                        visualEmpty={burnPlaying && burnOverlayReady}
                      />
                      {burnPlaying && firstCard ? (
                        <CardBurnAnimation
                          key={firstCard.user_card_id}
                          imageUrl={cardTextureUrl(firstCard)}
                          imageCacheBust={forgeImageCacheBust}
                          active={burnPlaying}
                          overlay
                          onBurnVisualReady={() => setBurnOverlayReady(true)}
                          onComplete={handleBurnAnimationComplete}
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 max-w-md space-y-3 sm:pt-0.5">
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        Add common cards here to burn them in the forge.
                      </p>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        For each common card you burn, you receive{" "}
                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                          {FORGE_COMMON_BURN_DUST_REWARD}
                        </span>{" "}
                        dust.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-4 sm:gap-x-2">
                    <ForgeSlotBox
                      filled={firstCard}
                      emptyLabel="Slot 1"
                      onOpenPicker={() => openPicker("first")}
                      onClear={clearAll}
                      clearLabel="Clear forge"
                    />

                    {showTwoSlots && (
                      <>
                        <SlotPlusDivider />
                        <ForgeSlotBox
                          filled={secondCard}
                          emptyLabel="Slot 2"
                          onOpenPicker={() => openPicker("second")}
                          onClear={clearSecondOnly}
                          clearLabel="Remove second card"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>

              {canSubmit && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrimary}
                    disabled={burnPlaying}
                    className="py-2.5 px-8 rounded-[15px] text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 transition-opacity shadow-[0px_4px_12px_0px_rgba(74,106,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    data-ph-capture-attribute-button={recipe?.slots === 2 ? "forge-swap" : "forge-burn"}
                  >
                    {recipe?.slots === 2 ? "Swap" : "Burn"}
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={burnPlaying}
                    className="py-2.5 px-6 rounded-[15px] text-sm font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    data-ph-capture-attribute-button="forge-reset"
                  >
                    Reset
                  </button>
                </div>
              )}
          </div>
        </div>
      </BlurCard>

      <ForgeCardSelectModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onSelect={handleSelectCard}
        sameCardIdAs={modalProps.sameCardIdAs}
        excludeUserCardIds={modalProps.excludeUserCardIds}
        title={modalProps.title}
        subtitle={modalProps.subtitle}
      />

      <Toast
        visible={toast.visible}
        variant="success"
        message={toast.message}
        onDismiss={() => setToast({ visible: false })}
      />
    </div>
  );
}
