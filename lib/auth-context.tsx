"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getNonce, 
  verifySignature, 
  getCurrentUser,
  logout as logoutApi,
  checkAlphaTestAccess
} from "./api";
import type { UserProfileResponse } from "./types";
import { AlphaTestAccessModal } from "@/components/AlphaTestAccessModal";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfileResponse | null;
  login: (force?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  signedWalletAddress: string | null;
  showAlphaTestModal: boolean;
  closeAlphaTestModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SIGNED_WALLET_KEY = "hodleague_signed_wallet";
const DECLINED_SIGNATURE_KEY = "hodleague_declined_signature";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { mutateAsync } = useSignMessage();
  const queryClient = useQueryClient();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedWalletAddress, setSignedWalletAddress] = useState<string | null>(null);
  const [showAlphaTestModal, setShowAlphaTestModal] = useState(false);
  
  // Используем ref для предотвращения множественных одновременных попыток авторизации
  const isLoggingInRef = useRef(false);
  // Отслеживаем адрес, для которого пользователь отменил подпись
  const declinedAddressRef = useRef<string | null>(null);
  // Отслеживаем предыдущее состояние подключения для предотвращения циклов
  const prevIsConnectedRef = useRef<boolean | undefined>(undefined);
  const prevAddressRef = useRef<string | undefined>(undefined);
  // Отслеживаем, для какого адреса мы уже пытались автоматически залогиниться
  const autoLoginAttemptedRef = useRef<string | null>(null);

  // Загружаем сохраненный адрес кошелька при монтировании
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem(SIGNED_WALLET_KEY);
      if (savedAddress) {
        setSignedWalletAddress(savedAddress);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Вызываем API для очистки кук на бэкенде
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
      // Продолжаем logout даже если API вызов не удался
    }
    setIsAuthenticated(false);
    setUser(null);
    setError(null);
    setSignedWalletAddress(null);
    // Сбрасываем флаг попытки автоматического логина
    autoLoginAttemptedRef.current = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(SIGNED_WALLET_KEY);
      // При logout не удаляем информацию об отмене подписи,
      // чтобы не предлагать подпись снова автоматически
    }
    
    // Инвалидируем все пользовательские данные при logout
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    // Полностью удаляем данные паков из кэша при logout
    queryClient.removeQueries({ queryKey: ["availablePacks"] });
    queryClient.removeQueries({ queryKey: ["packHistory"] });
    queryClient.removeQueries({ queryKey: ["packOpening"] });
    queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    queryClient.invalidateQueries({ queryKey: ["tournament"] });
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }, [queryClient]);

  const login = useCallback(async (force: boolean = false) => {
    if (!address || !isConnected) {
      setError("Кошелек не подключен");
      return;
    }

    // Предотвращаем множественные одновременные попытки
    if (isLoggingInRef.current) {
      return;
    }

    // Если это ручной вызов (force = true), сбрасываем информацию об отмене
    if (force) {
      declinedAddressRef.current = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem(DECLINED_SIGNATURE_KEY);
      }
    } else {
      // Проверяем, не отменил ли пользователь подпись для этого адреса (только для автоматических вызовов)
      if (typeof window !== "undefined") {
        const declinedAddress = localStorage.getItem(DECLINED_SIGNATURE_KEY);
        if (declinedAddress && declinedAddress.toLowerCase() === address.toLowerCase()) {
          // Пользователь уже отменил подпись для этого адреса
          return;
        }
      }

      // Проверяем ref для текущей сессии
      if (declinedAddressRef.current && declinedAddressRef.current.toLowerCase() === address.toLowerCase()) {
        return;
      }
    }

    isLoggingInRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // 0. Проверяем доступ к альфа-тесту перед началом авторизации
      const alphaTestCheck = await checkAlphaTestAccess(address);
      if (!alphaTestCheck.has_access) {
        setShowAlphaTestModal(true);
        setIsLoading(false);
        isLoggingInRef.current = false;
        return;
      }

      // 1. Get nonce from server
      const { message } = await getNonce(address);

      // 2. Sign message with wallet
      const signature = await mutateAsync({ account: address, message });

      // 3. Verify signature (токен устанавливается в куки на бэкенде)
      await verifySignature({
        wallet_address: address,
        signature,
      });

      // 4. Сохраняем адрес кошелька, на который подписывали
      setSignedWalletAddress(address);
      if (typeof window !== "undefined") {
        localStorage.setItem(SIGNED_WALLET_KEY, address);
        // Удаляем отметку об отмене, так как подпись прошла успешно
        localStorage.removeItem(DECLINED_SIGNATURE_KEY);
      }
      declinedAddressRef.current = null;
      // Сбрасываем флаг попытки автоматического логина при успешной авторизации
      autoLoginAttemptedRef.current = null;

      // 5. Получаем полный профиль пользователя после авторизации
      const userData = await getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      // Инвалидируем все пользовательские данные после успешной подписи
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["availablePacks"] });
      queryClient.invalidateQueries({ queryKey: ["packHistory"] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка авторизации";
      setError(errorMessage);
      console.error("Auth error:", err);
      
      // Если пользователь отменил подпись (UserRejectedRequestError или подобная ошибка)
      // Сохраняем это, чтобы не предлагать подпись снова автоматически
      if (err && typeof err === 'object' && 'code' in err) {
        const errorCode = (err as { code?: string | number }).code;
        // Коды ошибок для отмены пользователем: 4001, 'ACTION_REJECTED', 'USER_REJECTED'
        if (errorCode === 4001 || errorCode === 'ACTION_REJECTED' || errorCode === 'USER_REJECTED' || 
            errorMessage.toLowerCase().includes('reject') || errorMessage.toLowerCase().includes('denied') ||
            errorMessage.toLowerCase().includes('cancel')) {
          declinedAddressRef.current = address;
          if (typeof window !== "undefined") {
            localStorage.setItem(DECLINED_SIGNATURE_KEY, address);
          }
        }
      }
    } finally {
      setIsLoading(false);
      isLoggingInRef.current = false;
    }
  }, [address, isConnected, mutateAsync, queryClient]);

  // Check for existing auth on mount and when wallet connects
  useEffect(() => {
    // Проверяем, изменилось ли состояние подключения или адрес
    const isConnectedChanged = prevIsConnectedRef.current !== isConnected;
    const addressChanged = prevAddressRef.current !== address;
    
    // Обновляем refs
    prevIsConnectedRef.current = isConnected;
    prevAddressRef.current = address;
    
    // Выполняем проверку только если изменилось состояние подключения или адрес
    if (!isConnectedChanged && !addressChanged && prevIsConnectedRef.current !== undefined) {
      return;
    }

    const checkAuth = async () => {
      setIsLoading(true);
      
      if (isConnected && address) {
        // Загружаем информацию об отмененной подписи
        if (typeof window !== "undefined") {
          const declinedAddress = localStorage.getItem(DECLINED_SIGNATURE_KEY);
          if (declinedAddress && declinedAddress.toLowerCase() === address.toLowerCase()) {
            declinedAddressRef.current = declinedAddress;
          } else {
            declinedAddressRef.current = null;
          }
        }

        try {
          // Проверяем авторизацию через API (куки отправляются автоматически)
          const userData = await getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          
          // Загружаем сохраненный адрес кошелька, на который подписывали
          const savedAddress = typeof window !== "undefined" 
            ? localStorage.getItem(SIGNED_WALLET_KEY) 
            : null;
          setSignedWalletAddress(savedAddress);
          
          // Если текущий адрес не совпадает с подписанным, это означает смену кошелька
          // В этом случае нужно будет переподписать
          if (savedAddress && savedAddress.toLowerCase() !== address.toLowerCase()) {
           
            logout()
              .then(() => {
                console.log("[Wallet Switch] Logout  ");
              })
              .catch((error) => {
                console.error("[Wallet Switch] Error when logout:", error);
              });
            
            // Сбрасываем информацию об отмене при смене кошелька
            declinedAddressRef.current = null;
            if (typeof window !== "undefined") {
              localStorage.removeItem(DECLINED_SIGNATURE_KEY);
              console.log("[Wallet Switch] Signature information reset");
            }
          } else {
            // Если адреса совпадают и авторизация успешна, значит все в порядке
            console.log("[Auth Check] Authentication successful, cookie is valid");
          }
        } catch (error) {
          // Не авторизован или токен истек
          console.log("[Auth Check] Authentication failed:", error);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Кошелек отключен - делаем logout если был авторизован
        const savedAddress = typeof window !== "undefined" 
          ? localStorage.getItem(SIGNED_WALLET_KEY) 
          : null;
        if (savedAddress) {
          logout().catch(console.error);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
        declinedAddressRef.current = null;
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [isConnected, address, logout]);

  // Автоматически запрашиваем подпись, если кошелек подключен, но пользователь не авторизован
  // НЕ предлагаем автоматически, если пользователь уже отменил подпись для этого адреса
  // НЕ предлагаем, если авторизация еще проверяется или уже успешна
  useEffect(() => {
    // Не запрашиваем подпись, если:
    // 1. Кошелек не подключен
    // 2. Пользователь уже авторизован
    // 3. Идет загрузка (проверка авторизации)
    // 4. Уже идет процесс логина
    if (!isConnected || !address || isAuthenticated || isLoading || isLoggingInRef.current) {
      // Сбрасываем флаг попытки, если кошелек отключен или адрес изменился
      if (!isConnected || !address) {
        autoLoginAttemptedRef.current = null;
      }
      return;
    }

    // Проверяем, не пытались ли мы уже автоматически залогиниться для этого адреса
    if (autoLoginAttemptedRef.current && 
        autoLoginAttemptedRef.current.toLowerCase() === address.toLowerCase()) {
      return; // Уже пытались для этого адреса
    }

    // Проверяем, не отменил ли пользователь подпись для этого адреса
    const isDeclined = declinedAddressRef.current && 
      declinedAddressRef.current.toLowerCase() === address.toLowerCase();
    
    if (isDeclined) {
      return;
    }

    // Также проверяем localStorage
    if (typeof window !== "undefined") {
      const declinedAddress = localStorage.getItem(DECLINED_SIGNATURE_KEY);
      if (declinedAddress && declinedAddress.toLowerCase() === address.toLowerCase()) {
        return; // Не предлагаем автоматически
      }
    }

    // Проверяем, есть ли сохраненный адрес - если есть и он совпадает, значит пользователь уже подписывал
    const savedAddress = typeof window !== "undefined" 
      ? localStorage.getItem(SIGNED_WALLET_KEY) 
      : null;
    
    // Если адрес совпадает с сохраненным, но авторизация не прошла - значит кука протухла
    // Если адреса нет или не совпадает - это новый адрес или первый раз
    if (savedAddress && savedAddress.toLowerCase() === address.toLowerCase()) {
      // Адрес совпадает, но авторизация не прошла - кука протухла, нужно переподписать
    } else if (!savedAddress) {
      // Первый раз подключаем этот кошелек
    } else {
      // Адрес изменился - это обрабатывается в checkAuth через logout
      return;
    }
    
    // Отмечаем, что мы пытаемся залогиниться для этого адреса
    autoLoginAttemptedRef.current = address;
    
    login().catch((error) => {
      // При ошибке сбрасываем флаг, чтобы можно было попробовать снова
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code?: string | number }).code;
        // Если это не отмена пользователем, сбрасываем флаг
        if (errorCode !== 4001 && errorCode !== 'ACTION_REJECTED' && errorCode !== 'USER_REJECTED') {
          autoLoginAttemptedRef.current = null;
        }
      }
      console.error("Auto login error:", error);
    });
  }, [isConnected, address, isAuthenticated, isLoading, login]);

  // Auto-logout when wallet disconnects
  // Эта логика уже обрабатывается в checkAuth, поэтому этот useEffect можно убрать
  // чтобы избежать дублирования и циклов

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
