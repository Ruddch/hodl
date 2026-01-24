"use client";

import { MainLayout } from "@/components/MainLayout";
import { DeckSelectionModal } from "@/components/DeckSelectionModal";
import { useTournaments, useTournamentDetails, useValidateDeck, useRegisterForTournament } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRegisterDeckOnChain } from "@/lib/contracts/tournament-registry";
import { useAccount } from "wagmi";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Tournament } from "@/lib/types";

import { EpochSelector } from "./components/EpochSelector";
import { WeekSelector } from "./components/WeekSelector";
import { TournamentInfoCard } from "./components/TournamentInfoCard";
import { MyDeckCard } from "./components/MyDeckCard";
import { LeaderboardPreviewCard } from "./components/LeaderboardPreviewCard";

// Группировка турниров по эпохам (месяцам)
function groupTournamentsByEpoch(tournaments: Tournament[]) {
  const epochs: Record<string, Tournament[]> = {};

  tournaments.forEach((t) => {
    const date = new Date(t.start_date);
    const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" });
    const key = `${monthYear}`;

    if (!epochs[key]) {
      epochs[key] = [];
    }
    epochs[key].push(t);
  });

  // Сортируем турниры внутри эпохи по дате
  Object.keys(epochs).forEach((key) => {
    epochs[key].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  });

  return epochs;
}

function TournamentPageContent() {
  const { isAuthenticated, login, signedWalletAddress } = useAuth();
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedEpoch, setSelectedEpoch] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем турниры с большим лимитом чтобы иметь данные для группировки
  const { data: tournamentsData, isLoading: tournamentsLoading, refetch: refetchTournaments } = useTournaments({ limit: 50 });

  // Мутации для регистрации
  const validateDeckMutation = useValidateDeck();
  const registerMutation = useRegisterForTournament();
  const { registerDeck: registerDeckOnChain } = useRegisterDeckOnChain();

  // Группируем турниры по эпохам
  const epochs = useMemo(() => {
    if (!tournamentsData?.items.length) return {};
    return groupTournamentsByEpoch(tournamentsData.items);
  }, [tournamentsData]);

  const epochKeys = Object.keys(epochs);

  // Инициализация из URL при первой загрузке
  useEffect(() => {
    if (isInitialized || !epochKeys.length || !tournamentsData?.items.length) return;

    const urlEpoch = searchParams.get("epoch");
    const urlTournamentId = searchParams.get("tournamentId");

    if (urlEpoch && epochKeys.includes(urlEpoch)) {
      setSelectedEpoch(urlEpoch);
      
      if (urlTournamentId) {
        const tournamentId = parseInt(urlTournamentId, 10);
        const tournamentsInUrlEpoch = epochs[urlEpoch] || [];
        if (tournamentsInUrlEpoch.some((t) => t.id === tournamentId)) {
          setSelectedTournamentId(tournamentId);
        }
      }
    }

    setIsInitialized(true);
  }, [epochKeys.length, searchParams, tournamentsData?.items.length, isInitialized, epochs]);

  // Определяем текущую эпоху и турнир
  const currentEpoch = selectedEpoch || epochKeys[0] || null;

  // Мемоизируем турниры в эпохе
  const tournamentsInEpoch = useMemo(() => {
    return currentEpoch ? epochs[currentEpoch] || [] : [];
  }, [currentEpoch, epochs]);

  // Находим ближайший активный турнир или первый в списке
  const defaultTournamentId = useMemo(() => {
    if (!tournamentsInEpoch.length) return null;
    const active = tournamentsInEpoch.find((t) => t.status === "registration" || t.status === "ongoing");
    return active?.id || tournamentsInEpoch[0].id;
  }, [tournamentsInEpoch]);

  const currentTournamentId = selectedTournamentId || defaultTournamentId;

  // Обновление URL при изменении выбора
  useEffect(() => {
    if (!isInitialized || !currentEpoch) return;

    const currentEpochParam = searchParams.get("epoch");
    const currentTournamentIdParam = searchParams.get("tournamentId");

    // Проверяем, нужно ли обновлять URL
    const epochChanged = currentEpochParam !== currentEpoch;
    const tournamentIdChanged = currentTournamentIdParam !== (currentTournamentId?.toString() || null);

    if (!epochChanged && !tournamentIdChanged) return;

    const params = new URLSearchParams(searchParams.toString());
    
    if (currentEpoch) {
      params.set("epoch", currentEpoch);
    } else {
      params.delete("epoch");
    }

    if (currentTournamentId) {
      params.set("tournamentId", currentTournamentId.toString());
    } else {
      params.delete("tournamentId");
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(window.location.pathname + newUrl, { scroll: false });
  }, [currentEpoch, currentTournamentId, isInitialized, router, searchParams]);

  // Загружаем детали выбранного турнира
  const { data: tournamentDetails, isLoading: detailsLoading, refetch: refetchDetails } = useTournamentDetails(
    currentTournamentId ?? undefined,
    true
  );

  const currentTournament = tournamentDetails || tournamentsInEpoch.find((t) => t.id === currentTournamentId);

  const isLoading = tournamentsLoading || detailsLoading;

  // Можно ли регистрироваться
  const canRegister = currentTournament?.status === "registration" && !currentTournament?.is_registered;

  // Открытие модального окна выбора колоды
  const handleOpenDeckModal = () => {
    if (!isAuthenticated) {
      login(true);
      return;
    }
    setShowDeckModal(true);
  };

  // Регистрация на турнир
  const handleRegister = async (selectedCardIds: number[]) => {
    if (!currentTournament) return;

    // Проверяем, что активный кошелек совпадает с тем, на который подписывали
    if (signedWalletAddress && address && address.toLowerCase() !== signedWalletAddress.toLowerCase()) {
      alert("Активный кошелек не совпадает с кошельком, на который вы подписывали. Пожалуйста, переключите кошелек в вашем кошельке (Rabi Wallet) на адрес, который вы использовали для авторизации.");
      return;
    }

    setIsRegistering(true);
    try {
      // 1. Валидируем колоду на бэкенде
      const validation = await validateDeckMutation.mutateAsync({
        tournamentId: currentTournament.id,
        data: { deck_composition: selectedCardIds },
      });

      if (!validation.valid) {
        alert(validation.message || "Deck validation failed");
        return;
      }

      // 2. Регистрируем колоду в смарт-контракте
      // deck_hash возвращается от бэкенда в формате bytes32
      const deckHash = validation.deck_hash as `0x${string}`;
      
      console.log("Registering deck on blockchain...", {
        tournamentId: currentTournament.id,
        deckHash,
      });

      const txHash = await registerDeckOnChain(currentTournament.id, deckHash);
      
      console.log("Transaction submitted:", txHash);

      // 3. Отправляем tx_hash на бэкенд для подтверждения регистрации
      await registerMutation.mutateAsync({
        tournamentId: currentTournament.id,
        data: {
          deck_composition: selectedCardIds,
          tx_hash: txHash,
        },
      });

      // Закрываем модальное окно и обновляем данные
      setShowDeckModal(false);
      refetchTournaments();
      refetchDetails();
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-8xl mx-auto">
        {/* Фильтры: Эпоха + Недели */}
        <div className="flex items-center gap-9 mb-8">
          {tournamentsLoading ? (
            <>
              <div className="h-10 w-40 bg-zinc-200 rounded-lg animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-20 bg-zinc-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </>
          ) : epochKeys.length === 0 ? (
            <p className="text-zinc-500">No tournaments available</p>
          ) : (
            <>
              <EpochSelector
                epochs={epochKeys}
                selectedEpoch={currentEpoch || epochKeys[0]}
                onSelect={(epoch) => {
                  setSelectedEpoch(epoch);
                  // При смене эпохи сбрасываем выбор турнира, если он не существует в новой эпохе
                  const newTournaments = epochs[epoch] || [];
                  if (selectedTournamentId && !newTournaments.some((t) => t.id === selectedTournamentId)) {
                    setSelectedTournamentId(null);
                  }
                }}
              />

              <WeekSelector
                tournaments={tournamentsInEpoch}
                selectedId={currentTournamentId}
                onSelect={(id) => {
                  setSelectedTournamentId(id);
                }}
              />
            </>
          )}
        </div>

        {/* Основной контент */}
        {isLoading && !currentTournament ? (
          <div className="space-y-5">
            <div className="h-48 bg-zinc-200 rounded-[30px] animate-pulse"></div>
            <div className="h-64 bg-zinc-200 rounded-[30px] animate-pulse"></div>
            <div className="h-64 bg-zinc-200 rounded-[30px] animate-pulse"></div>
          </div>
        ) : currentTournament ? (
          <div className="space-y-5">
            <TournamentInfoCard 
              tournament={currentTournament} 
              onRegisterClick={handleOpenDeckModal}
            />
            <MyDeckCard
              isRegistered={currentTournament.is_registered || false}
              onStartClick={handleOpenDeckModal}
              canRegister={canRegister}
              myDeck={tournamentDetails?.my_deck}
              tournamentStatus={currentTournament.status}
              tournamentId={currentTournament.id}
            />
            <LeaderboardPreviewCard
              tournamentStatus={currentTournament.status}
              tournamentId={currentTournament.id}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-zinc-500">Select a tournament</p>
          </div>
        )}
      </div>

      {/* Deck Selection Modal */}
      {showDeckModal && currentTournament && (
        <DeckSelectionModal
          tournament={currentTournament}
          onClose={() => setShowDeckModal(false)}
          onRegister={handleRegister}
          isRegistering={isRegistering}
        />
      )}
    </MainLayout>
  );
}

export default function TournamentPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-8xl mx-auto">
          <div className="space-y-5">
            <div className="h-48 bg-zinc-200 rounded-[30px] animate-pulse"></div>
            <div className="h-64 bg-zinc-200 rounded-[30px] animate-pulse"></div>
            <div className="h-64 bg-zinc-200 rounded-[30px] animate-pulse"></div>
          </div>
        </div>
      </MainLayout>
    }>
      <TournamentPageContent />
    </Suspense>
  );
}
