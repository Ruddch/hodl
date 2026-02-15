"use client";

import { useState, useCallback } from "react";
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
    image: "/modal_img.png",
    title: {
      withoutConnection: "Welcome to Hodleague",
      withConnection: "Welcome back!",
    },
    description: {
      withoutConnection: "In beta you will get 5 new packs to bet every week some AI text maybe",
      withConnection: "You're already connected. Ready to play!",
    },
    buttonText: {
      withoutConnection: "Continue",
      withConnection: "Continue",
    },
    isLast: false,
    withWallet: false,
  },
  {
    image: "/modal_img.png",
    title: { withoutConnection: "How it works" },
    description: {
      withoutConnection:
        "Collect cards, build deck, and compete in tournaments to climb the leaderboard and earn rewards.",
    },
    buttonText: { withoutConnection: "Continue" },
    isLast: false,
    withWallet: false,
  },
  {
    image: "/modal_img.png",
    title: {
      withoutConnection: "Connect your wallet",
      withConnection: "You're all set",
    },
    description: {
      withoutConnection:
        "Link your wallet to start playing. You'll need it to open packs and participate in tournaments.",
      withConnection: "Your wallet is connected. Let's go!",
    },
    buttonText: {
      withoutConnection: "Connect Wallet",
      withConnection: "Finish",
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
                  className="w-full flex-shrink-0 flex flex-col min-h-[420px] px-10 py-8 md:px-16 md:py-12"
                >
                  {/* Контент — растягивается */}
                  <div className="flex-1 flex flex-col items-center text-center">
                    <div className="w-full max-w-[380px] mx-auto mb-6 aspect-[276/201] min-h-[140px] flex items-center justify-center">
                      {s.image ? (
                        <Image
                          src={s.image}
                          alt=""
                          width={276}
                          height={201}
                          className="w-full h-auto object-contain"
                          sizes="380px"
                        />
                      ) : null}
                    </div>

                    <h2 className="mb-3 text-center font-medium text-[22px] leading-[28px] md:text-[36px] md:leading-[44px] tracking-[0] text-[#FBFBFF] min-h-[28px] md:min-h-[44px]">
                      {getText(s.title, isConnected)}
                    </h2>

                    <p className="mb-4 text-center font-normal text-[16px] leading-[24px] md:text-[20px] md:leading-[32px] tracking-[0] text-white min-h-[72px] md:min-h-[96px]">
                      {getText(s.description, isConnected)}
                    </p>
                  </div>

                  {/* Точки и кнопки — прибиты к низу. min-h резервирует место под 2 кнопки — избегаем layout shift при переключении isConnected */}
                  <div className="mt-auto flex flex-col items-center">
                    <div className="w-full flex flex-col items-center min-h-[48px]">
                    {/* Action button — withWallet && !connected: Connect Wallet + Maybe Later; иначе обычная кнопка */}
                    {s.withWallet && !isConnected ? (
                      <div className="w-full max-w-[320px] flex flex-col sm:flex-row gap-3">
                        <ConnectKitButton.Custom>
                          {({ show }) => (
                            <button
                              onClick={show}
                              className="flex-1 cursor-pointer py-4 px-4 text-center text-[16px] font-medium leading-[1] tracking-[0] bg-[#2200EF] text-white rounded-[15px] hover:opacity-90 transition-opacity"
                            >
                              Connect Wallet
                            </button>
                          )}
                        </ConnectKitButton.Custom>
                        <button
                          onClick={handleClose}
                          className="flex-1 cursor-pointer py-4 px-4 text-center text-[16px] font-medium leading-[1] tracking-[0] bg-white text-[#2200EF] rounded-[15px] hover:opacity-90 transition-colors"
                        >
                          Maybe Later
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={s.isLast ? handleClose : handleNext}
                        className="w-full max-w-[320px] cursor-pointer py-4 px-4 text-center text-[16px] font-medium leading-[1] tracking-[0] bg-white text-[#2200EF] rounded-[15px] hover:opacity-90 transition-opacity"
                      >
                        {getText(s.buttonText, isConnected)}
                      </button>
                    )}
                    </div>
                    <div className="flex gap-2 mt-6">
                      {STEPS.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            i === step ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
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
  const [showWelcome, setShowWelcome] = useState(() => {
    if (!WELCOME_SCREEN_ENABLED) return false;
    if (typeof window === "undefined") return false;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      return true;
    }
  });

  const closeWelcome = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setShowWelcome(false);
  }, []);

  return { showWelcome, closeWelcome };
}
