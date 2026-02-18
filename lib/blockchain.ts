/**
 * Конфигурация поддерживаемых блокчейнов и адресов смарт-контрактов.
 * Бэкенд при валидации колоды возвращает recommended_chain_id — цепочку,
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
  [CHAIN_ID_AVALANCHE]: "0x0000000000000000000000000000000000000000" as `0x${string}`,
};

/** Получить адрес контракта для chainId */
export function getTournamentRegistryAddress(chainId: number): `0x${string}` | undefined {
  return TOURNAMENT_REGISTRY_ADDRESSES[chainId as SupportedChainId];
}

export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in TOURNAMENT_REGISTRY_ADDRESSES;
}
