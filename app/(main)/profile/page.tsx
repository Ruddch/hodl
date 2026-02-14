"use client";

import { useEffect, useState } from "react";
import { useMyProfile, useLogout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useUnviewedCards } from "@/lib/unviewed-cards-context";
import { useRouter } from "next/navigation";
import { ProfileBanner } from "./components/ProfileBanner";
import { UserAvatar } from "./components/UserAvatar";
import { StatsCards } from "./components/StatsCards";
import { CardsSection } from "./components/CardsSection";
import { Onboarding } from "@/components/Onboarding";
import { usePageOnboarding } from "@/lib/useOnboarding";
import { PROFILE_ONBOARDING } from "@/lib/onboarding-config";

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useMyProfile(true, isAuthenticated);
  const { clearUnviewedCards } = useUnviewedCards();
  const [activeTab, setActiveTab] = useState<"cards" | "tournaments">("cards");
  const logout = useLogout();
  const router = useRouter();

  useEffect(() => {
    clearUnviewedCards();
  }, [clearUnviewedCards]);

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/");
  };

  const pageReady = isAuthenticated && !isLoading && !!profile;
  const { run, steps, close, complete } = usePageOnboarding(
    "profile",
    PROFILE_ONBOARDING,
    pageReady
  );

  return (
    <div className="w-full max-w-8xl min-w-0 mx-auto min-h-full">
      <Onboarding steps={steps} run={run} onClose={close} onComplete={complete} />
      {!isAuthenticated ? (
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
            />
          </div>
        )}
    </div>
  );
}
