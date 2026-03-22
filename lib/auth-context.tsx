"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSignMessage, useDisconnect, useConnectionEffect, useConnections } from "wagmi";
import posthog from "posthog-js";
import { useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { 
  getNonce, 
  verifySignature, 
  getCurrentUser,
  logout as logoutApi,
  checkAlphaTestAccess
} from "./api";
import { REF_CODE_KEY } from "@/components/RefCapture";
import { clearStoredAcquisition, getStoredAcquisitionPayload } from "@/lib/acquisition";
import type { UserProfileResponse } from "./types";
import { AlphaTestAccessModal } from "@/components/AlphaTestAccessModal";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfileResponse | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
  signedWalletAddress: string | null;
  showAlphaTestModal: boolean;
  closeAlphaTestModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SIGNED_WALLET_KEY = "hodleague_signed_wallet";

// Функция для инвалидации всех запросов, которые зависят от пользователя
function invalidateUserQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["myProfile"] });
  queryClient.invalidateQueries({ queryKey: ["currentUser"] });
  queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  queryClient.invalidateQueries({ queryKey: ["packHistory"] });
  queryClient.invalidateQueries({ queryKey: ["tournaments"] });
  queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  // Удаляем кэш для паков и колоды (не инвалидируем, а полностью удаляем)
  queryClient.removeQueries({ queryKey: ["availablePacks"] });
  queryClient.removeQueries({ queryKey: ["packOpening"] });
  // Удаляем данные о колоде пользователя (my deck) для всех турниров
  // Query key: ["tournament", tournamentId, includeDeck]
  queryClient.removeQueries({ queryKey: ["tournament"] });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // const { address, isConnected } = useAccount();
  const connections = useConnections();
  const { mutateAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedWalletAddress, setSignedWalletAddress] = useState<string | null>(null);
  const [showAlphaTestModal, setShowAlphaTestModal] = useState(false);
  
  // Отслеживаем предыдущий адрес для определения смены кошелька
  const prevAddressRef = useRef<string | undefined>(undefined);
  const isLoggingInRef = useRef(false);

  // Загружаем сохраненный адрес кошелька при монтировании
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem(SIGNED_WALLET_KEY);
      if (savedAddress) {
        setSignedWalletAddress(savedAddress);
      }
    }
  }, []);

  useConnectionEffect({
    onConnect({ address }) {
      console.log('🟢 Wallet connected:', address)
      login(address);
    },
    onDisconnect() {
      console.log('🔴 Wallet disconnected')
      logout();
    },
  })

  const logout = useCallback(async () => {
    // 1. Вызываем API для очистки кук на бэкенде
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API error:", error);
    }
    
    // 2. Очищаем состояния
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    setSignedWalletAddress(null);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem(SIGNED_WALLET_KEY);
    }

    // 3. PostHog: сбрасываем distinct_id и user properties при logout
    posthog?.reset?.();
    
    // 4. Инвалидируем все запросы, которые зависят от пользователя
    invalidateUserQueries(queryClient);
  }, [queryClient]);

  // Функция disconnect: отключает кошелек и делает logout
  const handleDisconnect = useCallback(async () => {
    // 1. Отключаем кошелек
    disconnect();
    
    // 2. Делаем logout (очистка авторизации)
    await logout();
  }, [disconnect, logout]);

  const login = useCallback(async (manualAddress?: `0x${string}`) => {
    console.log('🔴 Login')
    console.log('🟢 Connections:', connections)
    const address = manualAddress || connections[0]?.accounts[0];
    if (!address) {
      console.log('🔴 Wallet not connected')
      return;
    }

    // Предотвращаем множественные одновременные попытки
    if (isLoggingInRef.current) {
      console.log('🔴 Already logging in')
      return;
    }

    isLoggingInRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Проверяем доступ к альфа-тесту (только на проде)
      if (process.env.NEXT_PUBLIC_ENV !== "development") {
        const alphaTestCheck = await checkAlphaTestAccess(address);
        if (!alphaTestCheck.has_access) {
          setShowAlphaTestModal(true);
          setIsLoading(false);
          isLoggingInRef.current = false;
          return;
        }
      }

      // 2. Запрашиваем nonce
      console.log('🔴 Requesting nonce')
      const { message } = await getNonce(address);

      // 3. Подписываем сообщение
      const signature = await mutateAsync({ account: address, message });

      // 4. Верифицируем подпись (токен устанавливается в куки на бэкенде)
      const refCode = typeof window !== "undefined" ? localStorage.getItem(REF_CODE_KEY) : null;
      const acquisition =
        typeof window !== "undefined" ? getStoredAcquisitionPayload() : null;
      await verifySignature({
        wallet_address: address,
        signature,
        message,
        ...(refCode && { referral_code: refCode }),
        ...(acquisition && { acquisition }),
      });
      if (refCode && typeof window !== "undefined") {
        localStorage.removeItem(REF_CODE_KEY);
      }
      if (acquisition && typeof window !== "undefined") {
        clearStoredAcquisition();
      }

      // 5. Сохраняем адрес кошелька
      setSignedWalletAddress(address);
      if (typeof window !== "undefined") {
        localStorage.setItem(SIGNED_WALLET_KEY, address);
      }

      // 6. Получаем пользователя
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      // 7. Инвалидируем все запросы, которые зависят от пользователя
      // При обновлении пользователя произойдут перезапросы всех зависимых ручек
     
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication error";
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
      invalidateUserQueries(queryClient);
      isLoggingInRef.current = false;
    }
  }, [connections, mutateAsync, queryClient]);

  // Проверка авторизации при монтировании и при подключении кошелька
  useEffect(() => {
    const address = connections[0]?.accounts[0];
    if (!address) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Проверяем авторизацию через API (куки отправляются автоматически)
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        
        // Загружаем сохраненный адрес
        const savedAddress = typeof window !== "undefined" 
          ? localStorage.getItem(SIGNED_WALLET_KEY) 
          : null;
        setSignedWalletAddress(savedAddress);
      } catch {
        // Не авторизован или токен истек
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [connections]);

  // Обработчик смены кошелька
  useEffect(() => {
    const address = connections[0]?.accounts[0];
    if (!address) {
      prevAddressRef.current = address;
      return;
    }

    const savedAddress = typeof window !== "undefined" 
      ? localStorage.getItem(SIGNED_WALLET_KEY) 
      : null;

    // Если адрес изменился и есть сохраненный адрес - это смена кошелька
    if (prevAddressRef.current && 
        prevAddressRef.current !== address && 
        savedAddress && 
        savedAddress.toLowerCase() === prevAddressRef.current.toLowerCase()) {
      // Смена кошелька: делаем logout и запрашиваем новую подпись
      logout().then(() => {
        // После logout запрашиваем новую подпись
        login();
      }).catch(console.error);
    }

    prevAddressRef.current = address;
  }, [connections, logout, login]);

  const closeAlphaTestModal = useCallback(() => {
    setShowAlphaTestModal(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        disconnect: handleDisconnect,
        error,
        signedWalletAddress,
        showAlphaTestModal,
        closeAlphaTestModal,
      }}
    >
      {children}
      {showAlphaTestModal && (
        <AlphaTestAccessModal onClose={closeAlphaTestModal} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
