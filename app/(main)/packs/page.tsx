"use client";

import { useAvailablePacks, useOpenPack } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUnviewedCards } from "@/lib/unviewed-cards-context";
import { useState, useEffect } from "react";
import Image from "next/image";
import type { OpenPackResponse } from "@/lib/types";
import { BlurCard } from "@/components/BlurCard";
import { OpenedPackModal } from "./components/OpenedPackModal";
import { Toast } from "@/components/Toast";
import { Onboarding } from "@/components/OnboardingLazy";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { PACKS_ONBOARDING } from "@/lib/onboarding-config";
import { BASE_PATH } from "@/lib/constants";

export default function PacksPage() {
  const base = BASE_PATH ? `${BASE_PATH}/` : "";
  const { isAuthenticated, login } = useAuth();
  const { data: packsData, refetch } = useAvailablePacks(isAuthenticated);
  const openPackMutation = useOpenPack();
  const { setUnviewedCards } = useUnviewedCards();
  const [openedPack, setOpenedPack] = useState<OpenPackResponse | null>(null);
  const [showPackOpenedToast, setShowPackOpenedToast] = useState(false);

  const totalPacks = packsData?.available_packs || 0;
  const isLoading = !packsData;

  // Предзагрузка изображений для анимации открытия пака
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

  const handleOpenPack = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    if (!packsData?.pack_types.length || totalPacks === 0) {
      return;
    }

    try {
      // Открываем первый доступный пак
      const firstPack = packsData.pack_types.find((pack) => pack.count > 0);
      if (!firstPack) return;

      const result = await openPackMutation.mutateAsync({
        pack_type_id: firstPack.pack_type_id,
      });
      setOpenedPack(result);
      refetch();
    } catch (error) {
      console.error("Failed to open pack:", error);
    }
  };

  return (
    <>
      <Onboarding steps={steps} run={run} onClose={close} onComplete={complete} />
      <div className="max-w-8xl mx-auto">
        {/* Banner */}
        <div
          className="relative rounded-[16px] overflow-hidden"
          style={{
            backgroundImage: "url('https://back.hodleague.com/static/card_templates/packs_background_classic_common_20260120_215426.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="px-4 py-6 md:px-8 md:py-12">
            <h1 className="text-xl md:text-[36px] font-medium leading-8 md:leading-[44px] tracking-normal text-white">
              Marketplace of packs <br/>
              will be available soon
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <BlurCard className="mt-6" backgroundColor="rgba(255, 179, 215, 1)">
          <div data-onboarding="packs-section" className="px-8 py-8">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">My packs</h2>
            <p className="text-base text-[var(--text-muted)] mb-8">
              In beta you will get 5 new packs to bet every week
            </p>
          
                {/* Packs Image with Badge */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Image
                  src="/packs.png"
                  alt="Packs"
                  width={250}
                  height={370}
                  className="object-contain h-[370px]"
                />
                {/* Badge */}
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

              {/* Open Packs Button */}
              <button
                data-onboarding="open-packs-btn"
                onClick={handleOpenPack}
                disabled={!isAuthenticated || totalPacks === 0 || openPackMutation.isPending}
                className={`my-7 flex flex-col items-center justify-center gap-2 w-[198px] h-12 pt-3 pb-3 rounded-[15px] text-base font-medium text-white leading-none tracking-normal text-center transition-colors ${
                  isAuthenticated && totalPacks > 0 && !openPackMutation.isPending
                    ? "bg-[var(--primary)] hover:opacity-90 cursor-pointer"
                    : "bg-[var(--text-muted)] cursor-not-allowed"
                }`}
              >
                {openPackMutation.isPending
                  ? "Opening..."
                  : !isAuthenticated
                  ? "Login to open packs"
                  : totalPacks === 0
                  ? "No packs available"
                  : "Open packs"}
              </button>
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
            setShowPackOpenedToast(true);
          }}
        />
    )}

      <Toast
        visible={showPackOpenedToast}
        onDismiss={() => setShowPackOpenedToast(false)}
      />
    </>
  );
}
