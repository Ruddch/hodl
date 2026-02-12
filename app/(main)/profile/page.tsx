"use client";

import { useState } from "react";
import { useMyProfile, useLogout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ProfileBanner } from "./components/ProfileBanner";
import { UserAvatar } from "./components/UserAvatar";
import { StatsCards } from "./components/StatsCards";
import { CardsSection } from "./components/CardsSection";

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading } = useMyProfile(true, isAuthenticated);
  const [activeTab, setActiveTab] = useState<"cards" | "tournaments">("cards");
  const logout = useLogout();
  const router = useRouter();

  const handleLogout = async () => {
    await logout.mutateAsync();
    router.push("/");
  };

  return (
    <div className="max-w-8xl mx-auto min-h-full">
        {!isAuthenticated ? (
          <p className="text-center text-zinc-500">Please connect your wallet to view your profile</p>
        ) : isLoading ? (
          <p className="text-center text-zinc-500">Loading...</p>
        ) : !profile ? (
          <p className="text-center text-zinc-500">Profile not found</p>
        ) : (
          <div className="space-y-4 sm:space-y-5">
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
