"use client";

import { useAvailablePacks, usePacksStore, useBuyPack } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUnviewedCards } from "@/lib/unviewed-cards-context";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ConfirmOpenPackResponse } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { SignInButton } from "@/components/SignInButton";
import { OpenedPackModal } from "./components/OpenedPackModal";
import { Toast } from "@/components/Toast";
import { Onboarding } from "@/components/OnboardingLazy";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { PACKS_ONBOARDING } from "@/lib/onboarding-config";
import { BASE_PATH } from "@/lib/constants";
import { usePackOpening, type PackOpeningStep } from "@/lib/hooks/usePackOpening";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { MarketplacePacks } from "./components/MarketplacePacks";

const STEP_LABELS: Record<PackOpeningStep, string> = {
  idle: "Open packs",
  preparing: "Preparing...",
  signing: "Sign transaction...",
  waiting_tx: "Waiting for confirmation...",
  confirming: "Confirming...",
  done: "Open packs",
  error: "Open packs",
};

export default function PacksPage() {
  const base = BASE_PATH ? `${BASE_PATH}/` : "";
  const { isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: packsData, refetch } = useAvailablePacks(isAuthenticated);
  const { data: storeData, isLoading: isStoreLoading } = usePacksStore(true);
  const buyPackMutation = useBuyPack();
  const { setUnviewedCards } = useUnviewedCards();
  const [openedPack, setOpenedPack] = useState<ConfirmOpenPackResponse | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; variant: "success" | "error"; message?: string }>({
    visible: false,
    variant: "success",
  });

  const { openPack, step, isLoading: isOpening, reset } = usePackOpening({
    onSuccess: (result) => {
      setOpenedPack(result);
      refetch();
    },
    onError: (error) => {
      setToast({ visible: true, variant: "error", message: error.message });
      refetch();
    },
  });

  const totalPacks = packsData?.available_packs || 0;
  const isLoading = !packsData;
  const [buyingPackTypeId, setBuyingPackTypeId] = useState<number | null>(null);

  const handleBuyPack = useCallback(
    async (packTypeId: number) => {
      setToast((t) => ({ ...t, visible: false }));
      setBuyingPackTypeId(packTypeId);
      try {
        await buyPackMutation.mutateAsync({ pack_type_id: packTypeId });
        setToast({ visible: true, variant: "success", message: "Pack purchased" });
        await refetch();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Purchase failed";
        setToast({ visible: true, variant: "error", message });
      } finally {
        setBuyingPackTypeId(null);
      }
    },
    [buyPackMutation, refetch]
  );

  useEffect(() => {
    const localPaths = [
      "packs.png",
      "pack-top.png",
      "pack-top copy.png",
      "pack-bottom-3.png",
      "pattern.svg",
      "card1.png",
    ];
    const path = (p: string) => (base ? `${base}${p}` : `/${p}`);
    [...localPaths.map(path), "https://back.hodleague.com/static/card_templates/packs_background_classic_common_20260120_215426.png"].forEach(
      (url) => {
        const img = new window.Image();
        img.src = url;
      }
    );
  }, [base]);

  const { run, steps, close, complete } = usePageOnboarding(
    "packs",
    PACKS_ONBOARDING,
    isAuthenticated && !isLoading
  );

  const handleOpenPack = useCallback(async () => {
    if (!packsData?.packs.length || totalPacks === 0) {
      return;
    }

    const firstPack = packsData.packs[0];
    if (!firstPack) return;

    setToast((t) => ({ ...t, visible: false }));
    reset();
    await openPack(firstPack.user_pack_id);
  }, [packsData, totalPacks, openPack, reset]);

  const needsConnectWallet = !(isConnected && address);
  const needsSignIn = Boolean(isConnected && address && !isAuthenticated);

  const openPackButtonLabel =
    totalPacks === 0 ? "No packs available" : STEP_LABELS[step];

  const openPackButtonDisabled = totalPacks === 0 || isOpening;

  const openPackButtonClassName = openPackButtonDisabled
    ? "bg-[var(--text-muted)] cursor-not-allowed"
    : "bg-[var(--primary)] hover:opacity-90 cursor-pointer";

  return (
    <>
      <Onboarding steps={steps} run={run} onClose={close} onComplete={complete} />
      <div className="max-w-8xl mx-auto">
        <MarketplacePacks
          packs={storeData?.packs}
          isLoading={Boolean(isStoreLoading)}
          needsConnectWallet={needsConnectWallet}
          needsSignIn={needsSignIn}
          buyingPackTypeId={buyingPackTypeId}
          onBuy={handleBuyPack}
        />

        {/* Main Content */}
        <BlurCard className="mt-6" backgroundColor="rgba(255, 179, 215, 1)">
          <div data-onboarding="packs-section" className="px-8 py-8">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">My packs</h2>
          
            <div className="flex flex-col items-center">
              <div className="relative">
                <Image
                  src="/packs.png"
                  alt="Packs"
                  width={250}
                  height={370}
                  className="object-contain h-[370px]"
                />
                {totalPacks > 0 && (
                  <div 
                    className="absolute w-12 h-12 flex items-center justify-center shadow-lg z-10"
                    style={{
                      backgroundColor: 'var(--badge-count)',
                      borderRadius: '11px',
                      top: '-12px',
                      right: '-12px',
                    }}
                  >
                    <span className="text-base font-semibold text-white">{totalPacks}</span>
                  </div>
                )}
              </div>

              {needsConnectWallet ? (
                <ConnectKitButton.Custom>
                  {({ show }) => (
                    <button
                      type="button"
                      onClick={show}
                      className="my-7 flex flex-col items-center justify-center gap-2 w-[198px] h-12 pt-3 pb-3 rounded-[15px] text-base font-medium text-white leading-none tracking-normal text-center transition-colors cursor-pointer bg-[var(--primary)] hover:opacity-90"
                      data-onboarding="open-packs-btn"
                      data-ph-capture-attribute-button="connect-wallet"
                      style={{
                        boxShadow:
                          "0px 4px 12px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)",
                      }}
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectKitButton.Custom>
              ) : needsSignIn ? (
                <SignInButton
                  variant="packs"
                  data-onboarding="open-packs-btn"
                  data-ph-capture-attribute-button="open-packs"
                />
              ) : (
                <button
                  data-onboarding="open-packs-btn"
                  onClick={handleOpenPack}
                  data-ph-capture-attribute-button="open-packs"
                  disabled={openPackButtonDisabled}
                  className={`my-7 flex flex-col items-center justify-center gap-2 w-[198px] h-12 pt-3 pb-3 rounded-[15px] text-base font-medium text-white leading-none tracking-normal text-center transition-colors ${openPackButtonClassName}`}
                >
                  {openPackButtonLabel}
                </button>
              )}

            </div>
          </div>
        </BlurCard>
    </div>

    {openedPack && (
        <OpenedPackModal
          result={openedPack}
          onClose={() => {
            setOpenedPack(null);
            setUnviewedCards();
            setToast({ visible: true, variant: "success" });
          }}
        />
    )}

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        message={toast.message}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  );
}
