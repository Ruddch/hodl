/**
 * Конфигурация поддерживаемых блокчейнов и адресов смарт-контрактов.
 * Бэкенд при валидации колоды возвращает preferred_network — сеть,
 * на которой у пользователя достаточно средств для транзакции.
 */

import { abstract } from "wagmi/chains";
import { avalanche } from "wagmi/chains";

export const CHAIN_ABSTRACT = abstract;
export const CHAIN_AVALANCHE = avalanche;

/** ID блокчейнов */
export const CHAIN_ID_ABSTRACT = abstract.id; // 2741
export const CHAIN_ID_AVALANCHE = avalanche.id; // 43114

/** Поддерживаемые цепочки для регистрации в турнирах */
export const SUPPORTED_REGISTRATION_CHAINS = [CHAIN_ABSTRACT, CHAIN_AVALANCHE] as const;

export type SupportedChainId = (typeof SUPPORTED_REGISTRATION_CHAINS)[number]["id"];

/** Адреса контракта TournamentRegistry по цепочкам */
export const TOURNAMENT_REGISTRY_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
  [CHAIN_ID_ABSTRACT]: "0x507Db3dfd3695270D7F2b08a25906e171C07B4C4" as `0x${string}`,
  [CHAIN_ID_AVALANCHE]: "0x6BE2e8C41E899c51e899B962e2C8dcED2125B48e" as `0x${string}`,
};

/** Получить адрес контракта для chainId */
export function getTournamentRegistryAddress(chainId: number): `0x${string}` | undefined {
  return TOURNAMENT_REGISTRY_ADDRESSES[chainId as SupportedChainId];
}

export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in TOURNAMENT_REGISTRY_ADDRESSES;
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
