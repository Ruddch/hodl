/**
 * Конфигурация поддерживаемых блокчейнов и адресов смарт-контрактов.
 * Бэкенд при валидации колоды возвращает preferred_network — сеть,
 * на которой у пользователя достаточно средств для транзакции.
 */

import { abstract } from "wagmi/chains";
import { avalanche, avalancheFuji } from "wagmi/chains";
import { IS_AVAX } from "./constants";

export const CHAIN_ABSTRACT = abstract;
export const CHAIN_AVALANCHE = avalanche;
export const CHAIN_AVALANCHE_FUJI = avalancheFuji;

/** ID блокчейнов */
export const CHAIN_ID_ABSTRACT = abstract.id; // 2741
export const CHAIN_ID_AVALANCHE = avalanche.id; // 43114
export const CHAIN_ID_AVALANCHE_FUJI = avalancheFuji.id; // 43113

/** Дефолтная цепочка (для fallback) */
export const DEFAULT_CHAIN_ID = IS_AVAX ? CHAIN_ID_AVALANCHE : CHAIN_ID_ABSTRACT;

/** Поддерживаемые цепочки для регистрации в турнирах */
export const SUPPORTED_REGISTRATION_CHAINS = IS_AVAX
  ? ([CHAIN_AVALANCHE] as const)
  : ([CHAIN_ABSTRACT, CHAIN_AVALANCHE] as const);

export type SupportedChainId = typeof CHAIN_ID_ABSTRACT | typeof CHAIN_ID_AVALANCHE;

/** Адреса контракта TournamentRegistry по цепочкам */
const ALL_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x507Db3dfd3695270D7F2b08a25906e171C07B4C4",
  [CHAIN_ID_AVALANCHE]: "0x6BE2e8C41E899c51e899B962e2C8dcED2125B48e",
};

/** Получить адрес контракта для chainId */
export function getTournamentRegistryAddress(chainId: number): `0x${string}` | undefined {
  if (IS_AVAX && chainId === CHAIN_ID_ABSTRACT) return undefined;
  return ALL_REGISTRY_ADDRESSES[chainId];
}

export function isChainSupported(chainId: number): boolean {
  if (IS_AVAX) return chainId === CHAIN_ID_AVALANCHE;
  return chainId in ALL_REGISTRY_ADDRESSES;
}

/** Адреса контракта HodleagueCards (mintWithSignature) по цепочкам */
const PACK_OPENER_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_AVALANCHE_FUJI]: "0xA8E0d17d72d97CB5C5Bf7f93eFaDc823BB2311eD",
};

export function getPackOpenerAddress(chainId: number): `0x${string}` | undefined {
  return PACK_OPENER_ADDRESSES[chainId];
}

export type PreferredNetwork = "abstract" | "avalanche";

const PREFERRED_NETWORK_TO_CHAIN_ID: Record<PreferredNetwork, SupportedChainId> = {
  avalanche: CHAIN_ID_AVALANCHE,
  abstract: CHAIN_ID_ABSTRACT,
};

/** Получить chainId по preferred_network */
export function getChainIdFromPreferredNetwork(network: PreferredNetwork): SupportedChainId {
  if (IS_AVAX) return CHAIN_ID_AVALANCHE;
  return PREFERRED_NETWORK_TO_CHAIN_ID[network];
}

/** Получить название сети по chainId */
export function getNetworkFromChainId(chainId: number): PreferredNetwork | undefined {
  if (chainId === CHAIN_ID_ABSTRACT) return "abstract";
  if (chainId === CHAIN_ID_AVALANCHE) return "avalanche";
  return undefined;
}
