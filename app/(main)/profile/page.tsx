"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMyProfile, useUserProfile, useLogout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUnviewedCards } from "@/lib/unviewed-cards-context";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ProfileBanner } from "./components/ProfileBanner";
import { UserAvatar } from "./components/UserAvatar";
import { StatsCards } from "./components/StatsCards";
import { CardsSection } from "./components/CardsSection";
import { Onboarding } from "@/components/Onboarding";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { PROFILE_ONBOARDING } from "@/lib/onboarding-config";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const walletParam = searchParams.get("wallet");
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();
  const { clearUnviewedCards } = useUnviewedCards();
  const [activeTab, setActiveTab] = useState<"cards" | "tournaments">("cards");
  const logout = useLogout();
  const router = useRouter();

  // Профиль другого пользователя по ?wallet=...
  const isViewingOther =
    !!walletParam && (!address || walletParam.toLowerCase() !== address.toLowerCase());
  const { data: otherProfile, isLoading: otherLoading, error: otherError } = useUserProfile(
    isViewingOther ? walletParam : undefined,
    true
  );
  const { data: myProfile, isLoading: myLoading } = useMyProfile(true, isAuthenticated && !isViewingOther);

  const profile = isViewingOther ? otherProfile : myProfile;
  const isLoading = isViewingOther ? otherLoading : myLoading;

  useEffect(() => {
    clearUnviewedCards();
  }, [clearUnviewedCards]);

  // Редирект на /profile без query, если смотрим на свой кошелёк
  useEffect(() => {
    if (walletParam && address && walletParam.toLowerCase() === address.toLowerCase()) {
      router.replace("/profile");
    }
  }, [walletParam, address, router]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/");
  };

  const pageReady = !isViewingOther && isAuthenticated && !isLoading && !!profile;
  const { run, steps, close, complete } = usePageOnboarding(
    "profile",
    PROFILE_ONBOARDING,
    pageReady
  );

  return (
    <div className="w-full max-w-8xl min-w-0 mx-auto min-h-full">
      <Onboarding steps={steps} run={run} onClose={close} onComplete={complete} />
      {isViewingOther ? (
        /* Профиль другого пользователя — не требует авторизации */
        isLoading ? (
          <p className="text-center text-[var(--text-muted)]">Loading...</p>
        ) : otherError || !profile ? (
          <p className="text-center text-[var(--text-muted)]">Profile not found</p>
        ) : (
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <ProfileBanner />
            <UserAvatar profile={profile} showReferralLink={false} />
            <StatsCards profile={profile} showReferrals={false} />
            <CardsSection
              profile={profile}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showTournamentStats={false}
            />
          </div>
        )
      ) : !isAuthenticated ? (
          <p className="text-center text-[var(--text-muted)]">Please connect your wallet to view your profile</p>
        ) : isLoading ? (
          <p className="text-center text-[var(--text-muted)]">Loading...</p>
        ) : !profile ? (
          <p className="text-center text-[var(--text-muted)]">Profile not found</p>
        ) : (
          <div className="space-y-4 sm:space-y-5 min-w-0">
            {/* Баннер профиля */}
            <ProfileBanner 
              onLogout={handleLogout}
            />

            {/* Аватар и имя пользователя */}
            <UserAvatar profile={profile} />

            {/* Карточки статистики */}
            <StatsCards profile={profile} />

            {/* Блок с toggle и картами */}
            <CardsSection
              profile={profile}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              showTournamentStats={true}
            />
          </div>
        )}
    </div>
  );
}
