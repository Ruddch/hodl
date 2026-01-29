"use client";

import { MainLayout } from "@/components/MainLayout";
import { DeckSelectionModal } from "@/components/DeckSelectionModal";
import { useTournaments, useTournamentDetails } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTournamentRegistration } from "@/lib/hooks/useTournamentRegistration";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Tournament } from "@/lib/types";

import { EpochSelector } from "./components/EpochSelector";
import { WeekSelector } from "./components/WeekSelector";
import { TournamentInfoCard } from "./components/TournamentInfoCard";
import { Deck } from "@/components/Deck";
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
  const { isAuthenticated, login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedEpoch, setSelectedEpoch] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Загружаем турниры с большим лимитом чтобы иметь данные для группировки
  const { data: tournamentsData, isLoading: tournamentsLoading, refetch: refetchTournaments } = useTournaments({ limit: 50 });

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
  }, [epochKeys.length, searchParams, tournamentsData?.items.length, isInitialized, epochs, epochKeys]);

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
    true,
    { refetchInterval: 5 * 60 * 1000 } // Обновление каждые 5 минут
  );

  const currentTournament = tournamentDetails || tournamentsInEpoch.find((t) => t.id === currentTournamentId);

  const isLoading = tournamentsLoading || detailsLoading;

  // Можно ли регистрироваться
  const canRegister = currentTournament?.status === "registration" && !currentTournament?.is_registered;

  // Хук для регистрации и отмены регистрации
  const { register, unregister, isRegistering, isUnregistering } = useTournamentRegistration({
    onSuccess: () => {
      // Обновляем данные после успешной регистрации/отмены регистрации
      refetchTournaments();
      refetchDetails();
      // Закрываем модальное окно после успешной регистрации
      setShowDeckModal(false);
    },
  });

  // Открытие модального окна выбора колоды
  const handleOpenDeckModal = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setShowDeckModal(true);
  };

  // Регистрация на турнир
  const handleRegister = async (selectedCardIds: number[]) => {
    if (!currentTournament) return;
    await register(currentTournament, selectedCardIds);
  };

  // Отмена регистрации на турнир
  const handleUnregister = async () => {
    if (!currentTournament) return;
    await unregister(currentTournament);
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
            <Deck
              isRegistered={currentTournament.is_registered || false}
              onStartClick={handleOpenDeckModal}
              canRegister={canRegister}
              myDeck={tournamentDetails?.my_deck}
              tournamentStatus={currentTournament.status}
              tournamentId={currentTournament.id}
              onUnregister={handleUnregister}
              isUnregistering={isUnregistering}
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
