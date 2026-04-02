"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import type { StorePack } from "@/lib/types";
import { BASE_PATH } from "@/lib/constants";
import { SignInButton } from "@/components/SignInButton";
import { ConnectKitButton } from "connectkit";
import { DustIcon } from "@/components/Icons";

const STORE_SLOT_COUNT = 3;

function publicAssetPath(filename: string): string {
  const base = BASE_PATH ? `${BASE_PATH}/` : "";
  return base ? `${base}${filename}` : `/${filename}`;
}

const SHOP_SECTION_BG_URL = publicAssetPath("shop_bg_3.png");
const SHOP_PACK_IMAGE_SRC = publicAssetPath("pack_2.png");

/** Как в `html[data-theme="dark"]` — чтобы в светлой теме текст шопа читался на ярком фоне */
const SHOP_TEXT_VARS = {
  "--text-primary": "#f4f4f5",
  "--text-muted": "rgba(244, 244, 245, 0.55)",
  "--text-secondary": "rgba(244, 244, 245, 0.7)",
} as CSSProperties;

type MarketplaceSlot =
  | { kind: "available"; pack: StorePack; index: number }
  | { kind: "soon"; index: number }
  | { kind: "loading"; index: number };

function buildSlots(packs: StorePack[] | undefined, isLoading: boolean): MarketplaceSlot[] {
  if (isLoading) {
    return [
      { kind: "loading", index: 0 },
      { kind: "soon", index: 1 },
      { kind: "soon", index: 2 },
    ];
  }
  return Array.from({ length: STORE_SLOT_COUNT }, (_, i) => {
    const p = packs?.[i];
    return p ? { kind: "available" as const, pack: p, index: i } : { kind: "soon" as const, index: i };
  });
}

const packButtonClass =
  "mt-2 flex w-full max-w-[160px] flex-col items-center justify-center gap-2 rounded-[15px] px-4 py-2.5 text-sm font-medium leading-none tracking-normal text-white transition-colors";

/** Тень «на полу» под паком + оболочка для объёма */
const packGroundClass =
  "pointer-events-none absolute bottom-[2%] left-1/2 z-0 h-[13%] w-[72%] -translate-x-1/2 rounded-[100%] bg-black/[0.28] blur-[11px]";

/** Слоистая тень под прозрачным PNG (один filter, иначе классы затирают друг друга) */
const packArtShadowClass =
  "drop-shadow-[0_2px_5px_rgba(0,0,0,0.2),0_9px_18px_rgba(0,0,0,0.22),0_20px_40px_rgba(0,0,0,0.14),0_34px_60px_rgba(0,0,0,0.08)]";

/** Те же тени, что в `packArtShadowClass`, для склейки с grayscale в одном `filter` у Soon */
const packArtDropShadowFilter =
  "drop-shadow(0 2px 5px rgba(0,0,0,0.2)) drop-shadow(0 9px 18px rgba(0,0,0,0.22)) drop-shadow(0 20px 40px rgba(0,0,0,0.14)) drop-shadow(0 34px 60px rgba(0,0,0,0.08))";

function PackArtDepth({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full">
      <div className={packGroundClass} aria-hidden />
      <div className="relative z-[1] h-full w-full translate-y-[-2px]">{children}</div>
    </div>
  );
}

interface MarketplacePacksProps {
  packs: StorePack[] | undefined;
  isLoading: boolean;
  needsConnectWallet: boolean;
  needsSignIn: boolean;
  buyingPackTypeId: number | null;
  onBuy: (packTypeId: number) => void;
}

export function MarketplacePacks({
  packs,
  isLoading,
  needsConnectWallet,
  needsSignIn,
  buyingPackTypeId,
  onBuy,
}: MarketplacePacksProps) {
  const slots = buildSlots(packs, isLoading);

  return (
    <div
      className="relative overflow-hidden rounded-[16px] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url("${SHOP_SECTION_BG_URL}")`,
        ...SHOP_TEXT_VARS,
      }}
    >
      <div className="relative z-[1] px-4 py-5 md:px-8 md:py-6">
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-2">Shop</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-3 md:gap-4">
          {slots.map((slot) => (
            <div
              key={slot.index}
              className={`flex flex-col items-center ${slot.kind === "soon" ? "hidden sm:flex" : ""}`}
            >
              <div className="relative w-full max-w-[158px] aspect-[250/370]">
                {slot.kind === "available" ? (
                  <PackArtDepth>
                    <Image
                      src={SHOP_PACK_IMAGE_SRC}
                      alt={slot.pack.name}
                      fill
                      sizes="158px"
                      className={`object-contain ${packArtShadowClass} contrast-90 brightness-125`}
                    />
                    {slot.pack.remaining > 0 && (
                      <div
                        className="absolute -right-0.5 -top-0.5 z-10 flex h-8 min-w-8 items-center justify-center rounded-[9px] px-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                        style={{ backgroundColor: "var(--badge-count)" }}
                      >
                        <span className="text-xs font-semibold text-white">{slot.pack.remaining}</span>
                      </div>
                    )}
                  </PackArtDepth>
                ) : slot.kind === "loading" ? (
                  <PackArtDepth>
                    <div className="h-full w-full animate-pulse rounded-2xl bg-gradient-to-b from-black/[0.07] to-black/[0.14] shadow-[0_6px_20px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-black/10" />
                  </PackArtDepth>
                ) : (
                  <SoonPackPlaceholder />
                )}
              </div>

              {slot.kind === "loading" ? (
                <>
                  <div className="mt-2 h-3 w-3/4 max-w-[140px] animate-pulse rounded bg-black/10" />
                  <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-black/10" />
                  <button
                    type="button"
                    disabled
                    className={`${packButtonClass} cursor-wait bg-black/10 text-[var(--text-muted)]`}
                  >
                    …
                  </button>
                </>
              ) : slot.kind === "available" ? (
                <div className="flex w-full flex-col items-center">
                  <p className="mt-2 text-center text-xs sm:text-sm font-medium text-[var(--text-primary)]">
                    {slot.pack.name}
                  </p>
                  {needsConnectWallet ? (
                    <ConnectKitButton.Custom>
                      {({ show }) => (
                        <button
                          type="button"
                          onClick={show}
                          className={`${packButtonClass} cursor-pointer bg-[var(--primary)] hover:opacity-90`}
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
                    <SignInButton variant="packs" className="mt-2 w-full max-w-[180px]" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onBuy(slot.pack.id)}
                      disabled={buyingPackTypeId !== null}
                      className={`${packButtonClass} ${
                        buyingPackTypeId !== null
                          ? "cursor-wait bg-[var(--text-muted)] opacity-80"
                          : "cursor-pointer bg-[var(--primary)] hover:opacity-90"
                      }`}
                      style={
                        buyingPackTypeId === null
                          ? {
                              boxShadow:
                                "0px 4px 12px 0px rgba(74, 106, 255, 0.3), 0px 2px 4px 0px rgba(74, 106, 255, 0.2)",
                            }
                          : undefined
                      }
                    >
                      {buyingPackTypeId === slot.pack.id ? (
                        "Buying…"
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                          <span>Buy for</span>
                          <span className="tabular-nums">{slot.pack.price}</span>
                          <DustIcon className="h-[1.1em] w-[1.1em] shrink-0" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-2 text-center text-xs sm:text-sm font-medium text-[var(--text-muted)]">Coming soon</p>
                  <button
                    type="button"
                    disabled
                    className={`${packButtonClass} cursor-not-allowed bg-black/10 text-[var(--text-muted)]`}
                  >
                    Soon
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SoonPackPlaceholder() {
  return (
    <PackArtDepth>
      <Image
        src={SHOP_PACK_IMAGE_SRC}
        alt=""
        fill
        sizes="158px"
        className="object-contain"
        style={{
          filter: `grayscale(1) contrast(0.75) blur(4px) ${packArtDropShadowFilter}`,
        }}
        aria-hidden
      />
    </PackArtDepth>
  );
}
