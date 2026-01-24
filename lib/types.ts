// ==================== Auth ====================
export interface NonceRequest {
  wallet_address: string;
}

export interface VerifyRequest {
  wallet_address: string;
  signature: string;
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
  deck_size?: number;
  my_deck_id?: number | null;
}

export interface TournamentDetail extends Tournament {
  description?: string | null;
  rules?: string | null;
  my_deck?: CardInDeckInfo[] | null;
  prizes?: PrizeConfig[];
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
  wallet_address?: string | null;
  final_score: number;
  deck_composition: number[];
  cards: CardInDeck[];
  prizes?: PrizeInfo[] | null;
  calculated_at: string;
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
  prize_type: string;
  amount: number;
  currency?: string | null;
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

export interface DeckValidateResponse {
  valid: boolean;
  deck_hash: string;
  total_weight: number;
  weight_limit: number;
  cards: CardInDeckResponse[];
  message: string;
}

export interface DeckRegisterRequest {
  deck_composition: number[];
  tx_hash: string;
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
  is_locked: boolean;
}

export interface UserProfileResponse {
  id: number;
  wallet_address: string;
  created_at: string;
  total_cards: number;
  total_tournaments: number;
  total_wins: number;
  cards?: UserCard[];
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
