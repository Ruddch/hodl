"use client";

import { useAuth } from "@/lib/auth-context";

export type SignInButtonVariant = "sidebar" | "packs" | "tournament";

const variantClassName: Record<SignInButtonVariant, string> = {
  sidebar:
    "w-full py-2 px-4 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed",
  packs:
    "my-7 flex flex-col items-center justify-center gap-2 w-[198px] h-12 pt-3 pb-3 rounded-[15px] text-base font-medium text-white leading-none tracking-normal text-center transition-colors bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed",
  tournament:
    "cursor-pointer px-6 sm:px-17 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-80 disabled:cursor-not-allowed text-white text-sm sm:text-base font-medium rounded-[15px] transition-colors",
};

interface SignInButtonProps {
  variant: SignInButtonVariant;
  className?: string;
  "data-ph-capture-attribute-button"?: string;
  "data-onboarding"?: string;
}

export function SignInButton({
  variant,
  className = "",
  "data-ph-capture-attribute-button": dataPh,
  "data-onboarding": dataOnboarding,
}: SignInButtonProps) {
  const { login, isLoading } = useAuth();

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className={[variantClassName[variant], className].filter(Boolean).join(" ")}
      data-ph-capture-attribute-button={dataPh}
      data-onboarding={dataOnboarding}
    >
      {isLoading ? "Signing in..." : "Sign In"}
    </button>
  );
}
