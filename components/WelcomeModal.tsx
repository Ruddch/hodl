"use client";

import { useState, useCallback, useEffect } from "react";
import { WELCOME_SCREEN_ENABLED } from "@/lib/feature-flags";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import Image from "next/image";

const WELCOME_SEEN_KEY = "hodleague_welcome_seen";

/** Текст для withoutConnection — обязателен. withConnection — опционален, показывается при подключённом кошельке */
type ConnectionText = {
  withoutConnection: string;
  withConnection?: string;
};

type StepConfig = {
  image: string | null;
  /** Соотношение сторон изображения, например "276/201" или "16/9" */
  imageAspectRatio?: string;
  /** Ширина изображения в px (для Next Image) */
  imageWidth?: number;
  /** Высота изображения в px (для Next Image) */
  imageHeight?: number;
  title: ConnectionText;
  description: ConnectionText;
  buttonText: ConnectionText;
  isLast: boolean;
  /** Если true — показываем Connect Wallet на этом шаге (когда кошелёк не подключён) */
  withWallet: boolean;
};

function getText(text: ConnectionText, isConnected: boolean): string {
  if (isConnected && text.withConnection != null && text.withConnection !== "") {
    return text.withConnection;
  }
  return text.withoutConnection;
}

const STEPS: StepConfig[] = [
  {
    image: "/modal_img_1.png",
    imageAspectRatio: "276/201",
    imageWidth: 309,
    imageHeight: 225,
    title: {
      withoutConnection: "Welcome to Hodleague",
      withConnection: "Welcome back!",
    },
    description: {
      withoutConnection:
        "A fantasy league where you collect token cards, build decks, and compete in weekly tournaments for rewards. Analyze the market, choose your lineup, and prove your crypto knowledge against other players.",
      withConnection:
        "A fantasy league where you collect token cards, build decks, and compete in weekly tournaments for rewards. Analyze the market, choose your lineup, and prove your crypto knowledge against other players.",
    },
    buttonText: {
      withoutConnection: "Next step →",
      withConnection: "Next step →",
    },
    isLast: false,
    withWallet: false,
  },
  {
    image: "/modal_img_2.png",
    imageAspectRatio: "309/450",
    imageWidth: 309,
    imageHeight: 450,
    title: { withoutConnection: "Your Weekly Cycle" },
    description: {
      withoutConnection:
        "Every week you receive 5 new card packs. Open them to collect tokens for the upcoming tournament. Build your deck, register for the tournament, and watch your cards compete based on real market performance from Monday to Friday. The best performing decks climb the leaderboard and earn rewards.",
    },
    buttonText: { withoutConnection: "Next step →" },
    isLast: false,
    withWallet: false,
  },
  {
    image: "/modal_img_3.png",
    imageAspectRatio: "309/225",
    imageWidth: 309,
    imageHeight: 225,
    title: {
      withoutConnection: "Build Smart, Not Random",
      withConnection: "Build Smart, Not Random",
    },
    description: {
      withoutConnection:
        "Each card has a weight value, and your deck has a total weight limit. Your job is to select tokens that will perform best during the tournament week while staying within the limit. It's not just picking winners — it's about balancing your lineup, analyzing trends, and making strategic trade-offs. The strongest combination wins.",
      withConnection:
        "Each card has a weight value, and your deck has a total weight limit. Your job is to select tokens that will perform best during the tournament week while staying within the limit. It's not just picking winners — it's about balancing your lineup, analyzing trends, and making strategic trade-offs. The strongest combination wins.",
    },
    buttonText: {
      withoutConnection: "Connect Wallet",
      withConnection: "Explore First",
    },
    isLast: true,
    withWallet: true,
  },
];

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(0);
  const { isConnected } = useAccount();
  const currentStep = STEPS[step];

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isConnected) {
      handleClose();
    }
  }, [isConnected, handleClose]);

  const handleNext = () => {
    if (currentStep.isLast) {
      handleClose();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal — фиксированные размеры */}
      <div
        className="relative w-full max-w-[640px] mx-4 overflow-hidden rounded-[32px] border border-white/10"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: "url(/gradient_modal.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          minHeight: "520px",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
          data-ph-capture-attribute-button="welcome-modal-close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="relative">
          {/* Слайды — горизонтальный карусель с анимацией */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              {STEPS.map((s, idx) => (
                <div
                  key={idx}
                  className="w-full flex-shrink-0 flex flex-col min-h-[420px] px-4 py-7 md:px-8 md:py-10"
                >
                  {/* Контент — выравнивание по левому краю */}
                  <div className="flex-1 flex flex-col items-start text-left">
                    <div
                      className="w-full px-4 md:px-10 h-[240px] md:h-[380px] mx-auto flex items-center justify-center overflow-hidden"
                      style={{ aspectRatio: s.imageAspectRatio ?? "276/201" }}
                    >
                      {s.image ? (
                        <Image
                          src={s.image}
                          alt=""
                          width={s.imageWidth ?? 276}
                          height={s.imageHeight ?? 201}
                          className="w-full h-full object-contain"
                          // sizes="(max-width: 768px) calc(100vw - 2rem), 380px"
                          priority={idx === 0}
                        />
                      ) : null}
                    </div>

                    <h2
                      className="mt-4 md:mt-6 mb-3 text-left font-medium text-[1.375rem] leading-[1.75rem] md:text-[2.25rem] md:leading-[2.75rem] tracking-[0] text-[#FBFBFF] min-h-[1.75rem] md:min-h-[2.75rem]"
                      style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                    >
                      {getText(s.title, isConnected)}
                    </h2>

                    <p
                      className="mb-4 text-left font-normal text-[0.875rem] leading-[1.375rem] md:text-[1.25rem] md:leading-[2rem] tracking-[0] text-[#FFFFFF] min-h-[4.5rem] md:min-h-[6rem]"
                      style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                    >
                      {getText(s.description, isConnected)}
                    </p>
                  </div>

                  {/* Индикатор шага слева, кнопка(и) справа */}
                  <div className="mt-1 md:mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-h-[48px]">
                    <span
                      className="text-[1rem] font-medium leading-[1] tracking-[0] text-[#FFFFFF] shrink-0"
                      style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                    >
                      {idx + 1} of {STEPS.length} steps
                    </span>
                    <div
                      className={`flex flex-col sm:flex-row gap-3 w-full sm:w-auto ${!(s.withWallet && !isConnected) ? "sm:flex-1 sm:justify-end sm:min-w-0" : "shrink-0"}`}
                    >
                      {s.withWallet && !isConnected ? (
                        <>
                          <ConnectKitButton.Custom>
                            {({ show }) => (
                              <button
                                onClick={show}
                                data-ph-capture-attribute-button="welcome-connect-wallet"
                                className="cursor-pointer py-4 px-6 text-center text-[1rem] font-medium leading-[1] tracking-[0] bg-[#2200EF] text-white rounded-[15px] hover:opacity-90 transition-opacity"
                                style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                              >
                                Connect Wallet
                              </button>
                            )}
                          </ConnectKitButton.Custom>
                          <button
                            onClick={handleClose}
                            className="cursor-pointer py-4 px-6 text-center text-[1rem] font-medium leading-[1] tracking-[0] bg-white text-[#2200EF] rounded-[15px] hover:opacity-90 transition-colors"
                            data-ph-capture-attribute-button="welcome-explore-first"
                            style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                          >
                            Explore First
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={s.isLast ? handleClose : handleNext}
                          data-ph-capture-attribute-button={s.isLast ? "welcome-finish" : "welcome-next"}
                          className="cursor-pointer py-4 px-6 w-full sm:w-[50%] min-w-0 sm:min-w-[8rem] text-center text-[1rem] font-medium leading-[1] tracking-[0] bg-white text-[#2200EF] rounded-[15px] hover:opacity-90 transition-opacity"
                          style={{ fontFamily: "var(--font-instrument-sans), sans-serif" }}
                        >
                          {s.isLast
                            ? getText(s.buttonText, isConnected)
                            : `${getText(s.buttonText, isConnected)}`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = WELCOME_SEEN_KEY;

export function useWelcomeModal() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!WELCOME_SCREEN_ENABLED) return;
    const timer = requestAnimationFrame(() => {
      if (typeof window === "undefined") return;
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setShowWelcome(true);
      }
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const closeWelcome = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setShowWelcome(false);
  }, []);

  return { showWelcome, closeWelcome };
}
