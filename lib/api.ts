import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type {
  TokenListResponse,
  TokenDetailResponse,
  TokenStatsResponse,
  LockDeckRequest,
  SessionResponse,
  SessionsListResponse,
  SimulateSessionRequest,
  PaginatedTournamentsResponse,
  TournamentDetail,
  LeaderboardResponse,
  DeckDetailResponse,
  DeckValidateRequest,
  DeckValidateResponse,
  DeckRegisterRequest,
  DeckRegisterResponse,
  DeckUnregisterRequest,
  DeckUnregisterResponse,
  NonceRequest,
  VerifyRequest,
  AuthResponse,
  UserProfileResponse,
  UpdateNicknameRequest,
  MyTournamentsResponse,
  CardCatalogResponse,
  CardDetailResponse,
  CardTournamentStatsResponse,
  TokensLeaderboardResponse,
  AvailablePacksResponse,
  PacksStoreResponse,
  BuyPackRequest,
  BuyPackResponse,
  OpenPackRequest,
  OpenPackResponse,
  PrepareOpenPackRequest,
  PrepareOpenPackResponse,
  ConfirmOpenPackRequest,
  ConfirmOpenPackResponse,
  PackHistoryResponse,
  AlphaTestCheckResponse,
  ClaimTournamentRewardsResponse,
  PrepareCardBurnRequest,
  PrepareCardBurnResponse,
  ConfirmCardBurnRequest,
  ConfirmCardBurnResponse,
  PrepareCardUpgradeRequest,
  PrepareCardUpgradeResponse,
  ConfirmCardUpgradeRequest,
  ConfirmCardUpgradeResponse,
} from "./types";
import { API_BASE_URL } from "./constants";

// ==================== Auth Storage ====================
const TOKEN_KEY = "hodleague_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ==================== Fetch Helpers ====================
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Куки отправляются автоматически браузером, не нужно добавлять Authorization заголовок

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Важно: включаем отправку кук
    });

    // Проверяем на ошибки CORS
    if (response.type === "opaque" || response.type === "opaqueredirect") {
      throw new Error("Failed to fetch");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(typeof error.detail === "string" ? error.detail : JSON.stringify(error.detail));
    }

    return response.json();
  } catch (error) {
    // Обработка сетевых ошибок и CORS
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error("Failed to fetch");
    }
    throw error;
  }
}

// ==================== Auth API ====================
export async function getNonce(walletAddress: string): Promise<{ message: string; nonce: string }> {
  return fetchApi("/api/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ wallet_address: walletAddress } as NonceRequest),
  });
}

export async function verifySignature(data: VerifyRequest): Promise<AuthResponse> {
  return fetchApi("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function testVerify(walletAddress: string): Promise<AuthResponse> {
  return fetchApi("/api/auth/test-verify", {
    method: "POST",
    body: JSON.stringify({ wallet_address: walletAddress } as NonceRequest),
  });
}

export async function getCurrentUser(): Promise<UserProfileResponse> {
  return fetchApi("/api/auth/me");
}

export async function logout(): Promise<void> {
  return fetchApi("/api/auth/logout", {
    method: "POST",
  });
}

// ==================== Tokens API ====================
export async function getTokens(): Promise<TokenListResponse> {
  return fetchApi("/api/tokens");
}

export async function getTokenDetails(symbol: string): Promise<TokenDetailResponse> {
  return fetchApi(`/api/tokens/${symbol}`);
}

export async function getSimulationTokens(): Promise<TokenListResponse> {
  return fetchApi("/api/simulation-tokens");
}

export async function getTokensStats(): Promise<TokenStatsResponse> {
  return fetchApi("/api/tokens-stats");
}

export interface GetTokensLeaderboardParams {
  limit?: number;
  offset?: number;
  is_active?: boolean | null;
  sort_by?: "calculated_score" | "symbol";
  sort_order?: "asc" | "desc";
}

export async function getTokensLeaderboard(
  params: GetTokensLeaderboardParams = {}
): Promise<TokensLeaderboardResponse> {
  const { sort_by = "calculated_score", sort_order = "desc", ...rest } = params;
  const searchParams = new URLSearchParams();
  if (rest.limit != null) searchParams.set("limit", String(rest.limit));
  if (rest.offset != null) searchParams.set("offset", String(rest.offset));
  if (rest.is_active != null) searchParams.set("is_active", String(rest.is_active));
  searchParams.set("sort_by", sort_by);
  searchParams.set("sort_order", sort_order);

  const query = searchParams.toString();
  return fetchApi(`/api/tokens/${query ? `?${query}` : ""}`);
}

// ==================== Sessions API ====================
export async function lockDeck(data: LockDeckRequest): Promise<SessionResponse> {
  return fetchApi("/api/lock-deck", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSession(sessionId: string): Promise<SessionResponse> {
  return fetchApi(`/api/session/${sessionId}`);
}

export async function getAllSessions(): Promise<SessionsListResponse> {
  return fetchApi("/api/sessions");
}

export async function simulateSession(data: SimulateSessionRequest): Promise<SessionResponse> {
  return fetchApi("/api/simulate-session", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSessionResults(sessionId: string): Promise<SessionResponse> {
  return fetchApi(`/api/session/${sessionId}/results`);
}

// ==================== Tournaments API ====================
export interface GetTournamentsParams {
  page?: number;
  limit?: number;
  status_filter?: string | null;
}

export async function getTournaments(params: GetTournamentsParams = {}): Promise<PaginatedTournamentsResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status_filter) searchParams.set("status_filter", params.status_filter);
  
  const query = searchParams.toString();
  return fetchApi(`/api/tournaments${query ? `?${query}` : ""}`);
}

export async function getTournamentDetails(
  tournamentId: number,
  includeDeck: boolean = false
): Promise<TournamentDetail> {
  const params = includeDeck ? "?include_deck=true" : "";
  return fetchApi(`/api/tournaments/${tournamentId}${params}`);
}

export interface GetLeaderboardParams {
  page?: number;
  limit?: number;
}

export async function getTournamentLeaderboard(
  tournamentId: number,
  params: GetLeaderboardParams = {}
): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  
  const query = searchParams.toString();
  return fetchApi(`/api/tournaments/${tournamentId}/leaderboard${query ? `?${query}` : ""}`);
}

export async function getTournamentDeck(
  tournamentId: number,
  deckId: number
): Promise<DeckDetailResponse> {
  return fetchApi(`/api/tournaments/${tournamentId}/decks/${deckId}`);
}

export async function validateDeck(
  tournamentId: number,
  data: DeckValidateRequest
): Promise<DeckValidateResponse> {
  return fetchApi(`/api/tournaments/${tournamentId}/validate-deck`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function registerForTournament(
  tournamentId: number,
  data: DeckRegisterRequest
): Promise<DeckRegisterResponse> {
  return fetchApi(`/api/tournaments/${tournamentId}/register`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function unregisterFromTournament(
  tournamentId: number,
  data: DeckUnregisterRequest
): Promise<DeckUnregisterResponse> {
  return fetchApi(`/api/tournaments/${tournamentId}/unregister`, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

// ==================== Users API ====================
export async function getMyProfile(includeCards: boolean = false): Promise<UserProfileResponse> {
  const params = includeCards ? "?include_cards=true" : "";
  return fetchApi(`/api/users/me${params}`);
}

export async function getUserProfile(
  walletAddress: string,
  includeCards: boolean = false
): Promise<UserProfileResponse> {
  const params = includeCards ? "?include_cards=true" : "";
  return fetchApi(`/api/users/${walletAddress}${params}`);
}

export async function getMyTournaments(): Promise<MyTournamentsResponse> {
  return fetchApi("/api/users/me/tournaments");
}

export async function updateMyNickname(data: UpdateNicknameRequest): Promise<UserProfileResponse> {
  return fetchApi("/api/users/me/nickname", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function claimTournamentRewards(
  tournamentId: number
): Promise<ClaimTournamentRewardsResponse> {
  return fetchApi(`/api/tournaments/${tournamentId}/claim-rewards`, {
    method: "POST",
  });
}

// ==================== Cards API ====================
export interface GetCardsParams {
  rarity?: string | null;
  token_symbol?: string | null;
}

export async function getCards(params: GetCardsParams = {}): Promise<CardCatalogResponse> {
  const searchParams = new URLSearchParams();
  if (params.rarity) searchParams.set("rarity", params.rarity);
  if (params.token_symbol) searchParams.set("token_symbol", params.token_symbol);
  
  const query = searchParams.toString();
  return fetchApi(`/api/cards${query ? `?${query}` : ""}`);
}

export async function getCardDetails(cardId: number): Promise<CardDetailResponse> {
  return fetchApi(`/api/cards/${cardId}`);
}

export interface GetCardTournamentStatsParams {
  limit?: number;
}

export async function getCardTournamentStats(
  cardId: number,
  params: GetCardTournamentStatsParams = {}
): Promise<CardTournamentStatsResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return fetchApi(`/api/cards/${cardId}/tournament-stats${query ? `?${query}` : ""}`);
}

// ==================== Packs API ====================
export async function getAvailablePacks(): Promise<AvailablePacksResponse> {
  return fetchApi("/api/packs/available");
}

export async function getPacksStore(): Promise<PacksStoreResponse> {
  return fetchApi("/api/packs/store");
}

export async function buyPack(data: BuyPackRequest): Promise<BuyPackResponse> {
  return fetchApi("/api/packs/buy", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function openPack(data: OpenPackRequest = {}): Promise<OpenPackResponse> {
  return fetchApi("/api/packs/open", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function prepareOpenPack(data: PrepareOpenPackRequest): Promise<PrepareOpenPackResponse> {
  return fetchApi("/api/packs/prepare-open", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmOpenPack(
  packOpeningId: number,
  data: ConfirmOpenPackRequest
): Promise<ConfirmOpenPackResponse> {
  return fetchApi(`/api/packs/openings/${packOpeningId}/confirm`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPackOpening(packOpeningId: number): Promise<OpenPackResponse> {
  return fetchApi(`/api/packs/openings/${packOpeningId}`);
}

export interface GetPackHistoryParams {
  limit?: number;
  offset?: number;
}

export async function getPackHistory(params: GetPackHistoryParams = {}): Promise<PackHistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  
  const query = searchParams.toString();
  return fetchApi(`/api/packs/history${query ? `?${query}` : ""}`);
}

// ==================== Card burn API ====================
export async function prepareCardBurn(data: PrepareCardBurnRequest): Promise<PrepareCardBurnResponse> {
  return fetchApi("/api/cards/burn/prepare", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmCardBurn(data: ConfirmCardBurnRequest): Promise<ConfirmCardBurnResponse> {
  return fetchApi("/api/cards/burn/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Card upgrade API ====================
export async function prepareCardUpgrade(data: PrepareCardUpgradeRequest): Promise<PrepareCardUpgradeResponse> {
  return fetchApi("/api/cards/upgrade/prepare", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function confirmCardUpgrade(data: ConfirmCardUpgradeRequest): Promise<ConfirmCardUpgradeResponse> {
  return fetchApi("/api/cards/upgrade/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== Alpha Test API ====================
export async function checkAlphaTestAccess(walletAddress: string): Promise<AlphaTestCheckResponse> {
  return fetchApi(`/api/alpha-test/check/${walletAddress}`);
}

// ==================== React Query Hooks ====================

// Auth Hooks
export function useCurrentUser(enabled: boolean = true) {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walletAddress, signature, message }: { 
      walletAddress: string; 
      signature: string; 
      message: string;
    }) => {
      console.log("verifySignature", walletAddress, signature, message);
      const response = await verifySignature({ wallet_address: walletAddress, signature, message });
      // Токен теперь в куках, не нужно сохранять в localStorage
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useTestLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await testVerify(walletAddress);
      // Токен теперь в куках, не нужно сохранять в localStorage
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        await logout(); // Вызываем API для очистки кук на бэкенде
      } catch (error) {
        console.error("Logout error:", error);
      }
      // Очищаем localStorage на всякий случай (для совместимости)
      removeStoredToken();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Token Hooks
export function useTokens() {
  return useQuery({
    queryKey: ["tokens"],
    queryFn: getTokens,
  });
}

export function useTokenDetails(symbol: string) {
  return useQuery({
    queryKey: ["token", symbol],
    queryFn: () => getTokenDetails(symbol),
    enabled: !!symbol,
  });
}

export function useSimulationTokens() {
  return useQuery({
    queryKey: ["simulationTokens"],
    queryFn: getSimulationTokens,
  });
}

export function useTokensStats() {
  return useQuery({
    queryKey: ["tokensStats"],
    queryFn: getTokensStats,
  });
}

export function useTokensLeaderboard(params: GetTokensLeaderboardParams = {}) {
  return useQuery({
    queryKey: ["tokensLeaderboard", params],
    queryFn: () => getTokensLeaderboard(params),
  });
}

const TOKENS_PAGE_SIZE = 50;

export function useTokensLeaderboardInfinite(
  params: Omit<GetTokensLeaderboardParams, "limit" | "offset"> = {}
) {
  return useInfiniteQuery({
    queryKey: ["tokensLeaderboard", "infinite", params],
    queryFn: ({ pageParam }) =>
      getTokensLeaderboard({
        ...params,
        limit: TOKENS_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { offset, limit, total } = lastPage.pagination;
      const nextOffset = offset + limit;
      return nextOffset < total ? nextOffset : undefined;
    },
  });
}

// Tournament Hooks
export function useTournaments(params: GetTournamentsParams = {}) {
  return useQuery({
    queryKey: ["tournaments", params],
    queryFn: () => getTournaments(params),
  });
}

export function useTournamentDetails(tournamentId: number | undefined, includeDeck: boolean = false, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["tournament", tournamentId, includeDeck],
    queryFn: () => getTournamentDetails(tournamentId!, includeDeck),
    enabled: !!tournamentId,
    ...options,
  });
}

export function useTournamentLeaderboard(tournamentId: number | undefined, params: GetLeaderboardParams = {}, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ["leaderboard", tournamentId, params],
    queryFn: () => getTournamentLeaderboard(tournamentId!, params),
    enabled: !!tournamentId,
    ...options,
  });
}

const LEADERBOARD_PAGE_SIZE = 50;

export function useTournamentLeaderboardInfinite(
  tournamentId: number | undefined,
  options?: { refetchInterval?: number }
) {
  return useInfiniteQuery({
    queryKey: ["leaderboard", tournamentId, "infinite"],
    queryFn: ({ pageParam }) =>
      getTournamentLeaderboard(tournamentId!, { page: pageParam, limit: LEADERBOARD_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.page + 1 : undefined),
    enabled: !!tournamentId,
    ...options,
  });
}

export function useTournamentDeck(tournamentId: number | undefined, deckId: number | undefined) {
  return useQuery({
    queryKey: ["deck", tournamentId, deckId],
    queryFn: () => getTournamentDeck(tournamentId!, deckId!),
    enabled: !!tournamentId && !!deckId,
  });
}

export function useValidateDeck() {
  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: number; data: DeckValidateRequest }) =>
      validateDeck(tournamentId, data),
  });
}

export function useRegisterForTournament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: number; data: DeckRegisterRequest }) =>
      registerForTournament(tournamentId, data),
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUnregisterFromTournament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tournamentId, data }: { tournamentId: number; data: DeckUnregisterRequest }) =>
      unregisterFromTournament(tournamentId, data),
    onSuccess: (_, { tournamentId }) => {
      queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useClaimTournamentRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tournamentId: number) => claimTournamentRewards(tournamentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTournaments"] });
    },
  });
}

// User Hooks
export function useMyProfile(includeCards: boolean = false, enabled: boolean = true) {
  return useQuery({
    queryKey: ["myProfile", includeCards],
    queryFn: () => getMyProfile(includeCards),
    enabled,
  });
}

export function useMyTournaments(enabled: boolean = true) {
  return useQuery({
    queryKey: ["myTournaments"],
    queryFn: getMyTournaments,
    enabled,
  });
}

export function useUserProfile(walletAddress: string | undefined, includeCards: boolean = false) {
  return useQuery({
    queryKey: ["userProfile", walletAddress, includeCards],
    queryFn: () => getUserProfile(walletAddress!, includeCards),
    enabled: !!walletAddress,
  });
}

export function useUpdateMyNickname() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNicknameRequest) => updateMyNickname(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

// Cards Hooks
export function useCards(params: GetCardsParams = {}) {
  return useQuery({
    queryKey: ["cards", params],
    queryFn: () => getCards(params),
  });
}

export function useCardDetails(cardId: number | undefined) {
  return useQuery({
    queryKey: ["card", cardId],
    queryFn: () => getCardDetails(cardId!),
    enabled: !!cardId,
  });
}

export function useCardTournamentStats(
  cardId: number | undefined,
  params: GetCardTournamentStatsParams = {}
) {
  return useQuery({
    queryKey: ["cardTournamentStats", cardId, params],
    queryFn: () => getCardTournamentStats(cardId!, params),
    enabled: !!cardId,
  });
}

// Packs Hooks
export function useAvailablePacks(enabled: boolean = true) {
  return useQuery({
    queryKey: ["availablePacks"],
    queryFn: getAvailablePacks,
    enabled,
  });
}

export function usePacksStore(enabled: boolean = true) {
  return useQuery({
    queryKey: ["packsStore"],
    queryFn: getPacksStore,
    enabled,
  });
}

export function useBuyPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BuyPackRequest) => buyPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availablePacks"] });
      queryClient.invalidateQueries({ queryKey: ["packsStore"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useOpenPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OpenPackRequest = {}) => openPack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availablePacks"] });
      queryClient.invalidateQueries({ queryKey: ["packHistory"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function usePrepareOpenPack() {
  return useMutation({
    mutationFn: (data: PrepareOpenPackRequest) => prepareOpenPack(data),
  });
}

export function useConfirmOpenPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packOpeningId, data }: { packOpeningId: number; data: ConfirmOpenPackRequest }) =>
      confirmOpenPack(packOpeningId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availablePacks"] });
      queryClient.invalidateQueries({ queryKey: ["packHistory"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function usePrepareCardBurn() {
  return useMutation({
    mutationFn: (data: PrepareCardBurnRequest) => prepareCardBurn(data),
  });
}

export function useConfirmCardBurn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmCardBurnRequest) => confirmCardBurn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function usePrepareCardUpgrade() {
  return useMutation({
    mutationFn: (data: PrepareCardUpgradeRequest) => prepareCardUpgrade(data),
  });
}

export function useConfirmCardUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConfirmCardUpgradeRequest) => confirmCardUpgrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function usePackOpening(packOpeningId: number | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["packOpening", packOpeningId],
    queryFn: () => getPackOpening(packOpeningId!),
    enabled: !!packOpeningId && enabled,
  });
}

export function usePackHistory(params: GetPackHistoryParams = {}, enabled: boolean = true) {
  return useQuery({
    queryKey: ["packHistory", params],
    queryFn: () => getPackHistory(params),
    enabled,
  });
}

// Session Hooks
export function useLockDeck() {
  return useMutation({
    mutationFn: (data: LockDeckRequest) => lockDeck(data),
  });
}

export function useSimulateSession() {
  return useMutation({
    mutationFn: (data: SimulateSessionRequest) => simulateSession(data),
  });
}

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSessionResults(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["sessionResults", sessionId],
    queryFn: () => getSessionResults(sessionId!),
    enabled: !!sessionId,
  });
}

// Alpha Test Hooks
export function useAlphaTestAccess(walletAddress: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ["alphaTestAccess", walletAddress],
    queryFn: () => checkAlphaTestAccess(walletAddress!),
    enabled: !!walletAddress && enabled,
  });
}
