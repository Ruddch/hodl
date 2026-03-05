// ==================== Auth ====================
export interface NonceRequest {
  wallet_address: string;
}

export interface VerifyRequest {
  wallet_address: string;
  signature: string;
  referral_code?: string | null;
  //message: string;
}

export interface AuthResponse {
  user: User;
  cards_granted?: number | null;
  packs_granted?: number | null;
}

export interface User {
  id: number;
  wallet_address: string;
  created_at: string;
  updated_at: string;
}

// ==================== Tokens ====================
export interface Token {
  symbol: string;
  name: string;
  image_url: string;
  weight: number;
  is_active: boolean;
  current_price?: number | null;
  market_cap?: number | null;
  change_24h?: number | null;
}

export interface TokenListResponse {
  tokens: Token[];
}

export interface TokenDetailResponse extends Token {
  prices?: TokenPrice[];
}

export interface TokenPrice {
  price: number;
  market_cap: number;
  change_24h: number;
  timestamp: string;
}

export interface TokenStatsResponse {
  total_tokens: number;
  active_tokens: number;
  avg_weight: number;
}

/** Токен из GET /api/tokens/ (leaderboard с ценой и score) */
export interface TokenWithRate {
  id: number;
  name: string;
  symbol: string;
  weight: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_price: {
    price: number;
    market_cap: number;
    change_24h: number;
    price_timestamp: string;
  };
  score: {
    calculated_score: number;
    tournament_change: number;
  };
}

export interface TokensLeaderboardResponse {
  success: boolean;
  data: TokenWithRate[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

// ==================== Sessions ====================
export interface LockDeckRequest {
  wallet_address: string;
  selected_tokens: string[];
  session_id?: string | null;
}

export interface SimulateSessionRequest {
  wallet_address: string;
  selected_tokens: string[];
}

export interface SessionResponse {
  session_id: string;
  wallet_address: string;
  status: string;
  selected_tokens: string[];
  locked_at?: string | null;
  simulation_result?: SimulationResult | null;
}

export interface SimulationResult {
  total_score: number;
  token_scores: Record<string, number>;
  rank?: number | null;
}

export interface SessionsListResponse {
  sessions: SessionResponse[];
}

// ==================== Tournaments ====================
export interface PrizePoolInfo {
  amount: string;
  currency_name: string;
}

export interface Tournament {
  id: number;
  tournament_number: number;
  status: 'registration' | 'ongoing' | 'finished';
  start_date: string;
  end_date: string;
  gameplay_start_date?: string | null;
  weight_limit: number;
  participants_count: number;
  is_registered?: boolean;
  // Опциональные поля которые могут быть в детальном ответе
  registration_start?: string;
  registration_end?: string;
  max_participants?: number | null;
  prize_pool?: string | null;
  prize_pools?: Record<string, PrizePoolInfo> | null;
  estimated_final_prize_pools?: Record<string, PrizePoolInfo> | null;
  deck_size?: number;
  my_deck_id?: number | null;
}

/** Сеть, в которой пользователь зарегистрировал колоду (приходит в include_deck=true) */
export interface MyRegistrationNetwork {
  network: "abstract" | "avalanche";
  chain_id: number;
  contract_address: string;
}

export interface TournamentDetail extends Tournament {
  description?: string | null;
  rules?: string | null;
  my_deck?: CardInDeckInfo[] | null;
  prizes?: PrizeConfig[];
  /** Сеть для анрегистрации колоды (когда include_deck=true и пользователь зарегистрирован) */
  my_registration_network?: MyRegistrationNetwork | null;
}

export interface PaginatedTournamentsResponse {
  items: Tournament[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// ==================== Leaderboard ====================
export interface LeaderboardEntry {
  position: number;
  user_id: number;
  deck_id?: number | null;
  wallet_address?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  final_score: number;
  deck_composition: number[];
  cards: CardInDeck[];
  prizes?: PrizeInfo[] | null;
  calculated_at: string;
}

// Детали колоды (ответ GET /api/tournaments/{id}/decks/{deck_id})
export interface DeckDetailCard {
  user_card_id: number;
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  token_weight: number;
  rarity_name: string;
  rarity_color: string;
  design_type: string;
  rendered_image_url: string;
  current_price: number | null;
  market_cap: number | null;
  tournament_change: number | null;
  calculated_score: number;
}

export interface DeckDetailResponse {
  deck_id: number;
  tournament_id: number;
  tournament_number: number;
  tournament_status: string;
  user_id: number;
  wallet_address: string | null;
  nickname: string | null;
  avatar_url: string | null;
  deck_composition: number[];
  cards: DeckDetailCard[];
  total_weight: number;
  submitted_at: string;
  position: number;
  final_score: number;
  prizes: PrizeInfo[];
}

export interface LeaderboardResponse {
  tournament_id: number;
  tournament_number: number;
  status: string;
  leaderboard: LeaderboardEntry[];
  total_participants: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
  my_position?: LeaderboardEntry | null;
  last_updated?: string | null;
}

export interface PrizeInfo {
  reward_type_id: number;
  reward_name: string;
  reward_category: string;
  currency_type: string;
  amount: string;
}

export interface PrizeConfig {
  position_from: number;
  position_to: number;
  prize_type: string;
  amount: number;
}

// ==================== Cards ====================
export interface CardBase {
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  token_weight: number;
  rarity_name: string;
  rarity_color: string;
  rarity_score_bonus: number;
  design_type: string;
  rendered_image_url: string;
  current_price?: number | null;
  market_cap?: number | null;
  tournament_change?: number | null;
  calculated_score: number;
}

export interface CardCatalogResponse {
  total: number;
  cards: CardBase[];
}

export interface CardDetailResponse extends CardBase {
  stats: CardStats;
}

export interface CardTournamentStatsRarity {
  id: number;
  name: string;
  score_bonus: number;
  color: string;
}

export interface CardTournamentPrice {
  date: string;
  price: number;
}

export interface CardTournamentScore {
  tournament_number: number;
  base_score: number;
  final_score: number;
  score_multiplier: number;
}

export interface CardTournamentWeight {
  tournament_number: number;
  weight: number | null;
}

export interface CardTournamentStatsData {
  prices: CardTournamentPrice[];
  scores: CardTournamentScore[];
  weights: CardTournamentWeight[];
}

export interface CardTournamentStatsResponse {
  card_id: number;
  token_id: number;
  token_symbol: string;
  rarity: CardTournamentStatsRarity;
  tournaments_count: number;
  data: CardTournamentStatsData;
}

export interface CardStats {
  total_owned: number;
  unique_owners: number;
}

export interface CardInDeck {
  card_id: number;
  token_id: number;
  token_symbol: string;
  token_name: string;
  rarity: string;
  design_type: string;
  rendered_image_url?: string | null;
  template_image_url: string;
}

export interface CardInDeckInfo {
  user_card_id: number;
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  token_weight: number;
  rarity_name: string;
  rarity_color: string;
  rarity_score_bonus: number;
  design_type: string;
  rendered_image_url: string;
  current_price?: number | null;
  market_cap?: number | null;
  tournament_change?: number | null;
  calculated_score: number;
}

export interface CardInDeckResponse {
  user_card_id: number;
  card_name: string;
  rarity: string;
  weight: number;
}

// ==================== Deck Validation & Registration ====================
export interface DeckValidateRequest {
  deck_composition: number[];
}

/** Информация о балансе на блокчейне (от бэкенда) */
export interface ChainBalanceInfo {
  chain_id: number;
  has_sufficient_balance: boolean;
}

export interface DeckValidateResponse {
  valid: boolean;
  deck_hash: string;
  total_weight: number;
  weight_limit: number;
  cards: CardInDeckResponse[];
  message: string;
  /** Рекомендуемая сеть для регистрации (бэкенд выбирает по балансу газа) */
  preferred_network?: "abstract" | "avalanche";
  /** Информация о балансе по блокчейнам (если бэкенд её возвращает) */
  chain_balances?: ChainBalanceInfo[];
}

export interface DeckRegisterRequest {
  deck_composition: number[];
  tx_hash: string;
  /** Название сети, в которой происходила регистрация */
  network?: "abstract" | "avalanche";
}

export interface DeckRegisterResponse {
  success: boolean;
  deck_id: number;
  deck_hash: string;
  tx_hash: string;
  total_weight: number;
  cards: CardInDeckResponse[];
  message: string;
}

export interface DeckUnregisterRequest {
  tx_hash: string;
  /** Название сети, в которой происходила отмена регистрации */
  network?: "abstract" | "avalanche";
}

export interface DeckUnregisterResponse {
  success: boolean;
  cards_unlocked: number;
  tx_hash: string;
  message: string;
}

// ==================== Packs ====================
export interface PackTypeDetail {
  pack_type_id: number;
  name: string;
  description: string;
  image_url: string;
  header_image_url: string;
  cards_per_pack: number;
  price: number;
  currency: string;
  supply?: number | null;
  available_from?: string | null;
  available_until?: string | null;
  is_active: boolean;
  count: number;
}

export interface AvailablePacksResponse {
  available_packs: number;
  pack_types: PackTypeDetail[];
}

export interface OpenPackRequest {
  pack_type_id?: number | null;
}

export interface CardReceived {
  user_card_id: number;
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  rarity_name: string;
  rarity_color: string;
  design_type: string;
  rendered_image_url: string;
}

export interface OpenPackResponse {
  pack_opening_id: number;
  pack_type_name: string;
  opened_at: string;
  cards_received: CardReceived[];
}

export interface PackHistoryItem {
  pack_opening_id: number;
  pack_type_name: string;
  opened_at: string;
  cards_count: number;
  cards_received: CardReceived[];
}

export interface PackHistoryResponse {
  total: number;
  openings: PackHistoryItem[];
}

// ==================== Users ====================
export interface MyTournamentCard {
  user_card_id: number;
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  rendered_image_url: string;
  design_type: string;
  rarity_name: string;
}

export interface MyTournamentPrize {
  reward_type_id: number;
  reward_name: string;
  reward_category: string;
  currency_type: string;
  amount: string;
  claim_status: string;
  earned_at: string;
  claimed_at: string | null;
  expires_at: string | null;
}

export interface MyTournamentEntry {
  tournament_id: number;
  tournament_number: number;
  status: string;
  start_date: string;
  end_date: string;
  position: number;
  final_score: number;
  deck_id: number;
  deck_composition: number[];
  cards: MyTournamentCard[];
  prizes: MyTournamentPrize[];
  registered_at: string;
  calculated_at: string;
}

export interface MyTournamentsResponse {
  user_id: number;
  wallet_address: string;
  tournaments: MyTournamentEntry[];
  total_tournaments: number;
  best_position: number;
  best_score: number;
}

export interface UserCard {
  user_card_id: number;
  card_id: number;
  token_symbol: string;
  token_name: string;
  token_image_url: string;
  token_weight: number;
  rarity_name: string;
  rarity_color: string;
  rarity_score_bonus: number;
  design_type: string;
  rendered_image_url: string;
  acquired_at: string;
  expires_at?: string | null;
  is_locked: boolean;
}

export interface UserBalanceItem {
  reward_type_id: number;
  name: string;
  category: string;
  currency_type: string;
  available: number;
  pending: number;
  pending_count: number;
  claimed_count: number;
  last_earned: string;
}

export interface UserStats {
  total_cards: number;
  tournaments_participated: number;
  best_position: number;
  best_score: number;
  balances: UserBalanceItem[];
}

export interface UserProfileResponse {
  id: number;
  wallet_address: string;
  created_at: string;
  total_cards: number;
  total_tournaments: number;
  total_wins: number;
  cards?: UserCard[];
  stats?: UserStats;
  avatar_url?: string | null;
  nickname?: string | null;
  referral_count?: number;
  referral_link?: string | null;
  referral_route?: string | null;
}

// ==================== Alpha Test ====================
export interface AlphaTestCheckResponse {
  wallet_address: string;
  has_access: boolean;
  added_at: string;
}

// ==================== API Error ====================
export interface ApiError {
  detail: string | ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
