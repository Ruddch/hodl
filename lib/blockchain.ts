/**
 * Конфигурация поддерживаемых блокчейнов и адресов смарт-контрактов.
 * Бэкенд при валидации колоды возвращает preferred_network — сеть,
 * на которой у пользователя достаточно средств для транзакции.
 */

import { abstract } from "wagmi/chains";
import { avalanche} from "wagmi/chains";
import { IS_AVAX } from "./constants";

export const CHAIN_ABSTRACT = abstract;
export const CHAIN_AVALANCHE = avalanche;

/** ID блокчейнов */
export const CHAIN_ID_ABSTRACT = abstract.id; // 2741
export const CHAIN_ID_AVALANCHE = avalanche.id; // 43114

/** Дефолтная цепочка (для fallback). В режиме AVAX — Fuji для регистрации в турнирах */
export const DEFAULT_CHAIN_ID = IS_AVAX ? CHAIN_ID_AVALANCHE : CHAIN_ID_ABSTRACT;

/** Поддерживаемые цепочки для регистрации в турнирах */
export const SUPPORTED_REGISTRATION_CHAINS = ([CHAIN_ABSTRACT, CHAIN_AVALANCHE] as const);

export type SupportedChainId =
  | typeof CHAIN_ID_ABSTRACT
  | typeof CHAIN_ID_AVALANCHE;

/** Адреса контракта TournamentRegistry по цепочкам */
const ALL_REGISTRY_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x1B95b5E48FacD5c825EC706bd8EE4380b5E3cBbd",
  [CHAIN_ID_AVALANCHE]: "0xb637d4D74c03580f649D7E6DaC4873E06B314a3C",
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

/** Адреса контракта HodleagueCards (mintWithSignature) по цепочкам.
 *  Для Abstract сейчас используется заглушка — транзакции будут отправляться
 *  на этот адрес, но контракт там может быть не развёрнут.
 */
const PACK_OPENER_ADDRESSES: Record<number, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x88f735241AeAEfC83e753355fEb522Eaf4B4Fc60",
  [CHAIN_ID_AVALANCHE]: "0xf4c848d9C00832B564353493c11C97A757F2eE10",
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
  return PREFERRED_NETWORK_TO_CHAIN_ID[network];
}

/** Получить название сети по chainId */
export function getNetworkFromChainId(chainId: number): PreferredNetwork | undefined {
  if (chainId === CHAIN_ID_ABSTRACT) return "abstract";
  if (chainId === CHAIN_ID_AVALANCHE) return "avalanche";
  return undefined;
}
