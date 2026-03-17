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

/** Дефолтная цепочка (для fallback). В режиме AVAX — Fuji для регистрации в турнирах */
export const DEFAULT_CHAIN_ID = IS_AVAX ? CHAIN_ID_AVALANCHE_FUJI : CHAIN_ID_ABSTRACT;

/** Поддерживаемые цепочки для регистрации в турнирах */
export const SUPPORTED_REGISTRATION_CHAINS = IS_AVAX
  ? ([CHAIN_AVALANCHE_FUJI] as const)
  : ([CHAIN_ABSTRACT, CHAIN_AVALANCHE] as const);

export type SupportedChainId =
  | typeof CHAIN_ID_ABSTRACT
  | typeof CHAIN_ID_AVALANCHE_FUJI;

/** Адреса контракта TournamentRegistry по цепочкам */
const ALL_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x507Db3dfd3695270D7F2b08a25906e171C07B4C4",
  [CHAIN_ID_AVALANCHE]: "0x6BE2e8C41E899c51e899B962e2C8dcED2125B48e",
  [CHAIN_ID_AVALANCHE_FUJI]: "0x2Fa5F1C94061Ff8d1D8706D7FC184F9162C7d444",
};

/** Получить адрес контракта для chainId */
export function getTournamentRegistryAddress(chainId: number): `0x${string}` | undefined {
  if (IS_AVAX && chainId === CHAIN_ID_ABSTRACT) return undefined;
  return ALL_REGISTRY_ADDRESSES[chainId];
}

export function isChainSupported(chainId: number): boolean {
  if (IS_AVAX) return chainId === CHAIN_ID_AVALANCHE_FUJI;
  return chainId in ALL_REGISTRY_ADDRESSES;
}

/** Адреса контракта HodleagueCards (mintWithSignature) по цепочкам.
 *  Для Abstract сейчас используется заглушка — транзакции будут отправляться
 *  на этот адрес, но контракт там может быть не развёрнут.
 */
const PACK_OPENER_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x88f735241AeAEfC83e753355fEb522Eaf4B4Fc60",
  [CHAIN_ID_AVALANCHE]: "0xf4c848d9C00832B564353493c11C97A757F2eE10",
  [CHAIN_ID_AVALANCHE_FUJI]: "0xC6d712e7cd67E0e6aC2d4210A78B9B1e11639923",
};

export function getPackOpenerAddress(chainId: number): `0x${string}` | undefined {
  return PACK_OPENER_ADDRESSES[chainId];
}

export type PreferredNetwork = "abstract" | "avalanche";

const PREFERRED_NETWORK_TO_CHAIN_ID: Record<PreferredNetwork, SupportedChainId> = {
  avalanche: CHAIN_ID_AVALANCHE_FUJI,
  abstract: CHAIN_ID_ABSTRACT,
};

/** Получить chainId по preferred_network */
export function getChainIdFromPreferredNetwork(network: PreferredNetwork): SupportedChainId {
  if (IS_AVAX) return CHAIN_ID_AVALANCHE_FUJI;
  return PREFERRED_NETWORK_TO_CHAIN_ID[network];
}

/** Получить название сети по chainId */
export function getNetworkFromChainId(chainId: number): PreferredNetwork | undefined {
  if (chainId === CHAIN_ID_ABSTRACT) return "abstract";
  if (chainId === CHAIN_ID_AVALANCHE_FUJI) return "avalanche";
  return undefined;
}
