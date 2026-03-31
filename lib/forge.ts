import type { UserCard } from "@/lib/types";

/** Рецепт свопа в кузнице зависит от редкости первой выбранной карты */
export type ForgeSwapRecipe = {
  slots: 1 | 2;
  requireDuplicateCardId: boolean;
};

function normalizeRarityName(name: string | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

/** Пыль за сжигание одной common-карты в forge (swap / burn) */
export const FORGE_COMMON_BURN_DUST_REWARD = 20;

export function isCommonRarity(card: UserCard): boolean {
  return normalizeRarityName(card.rarity_name) === "common";
}

export function getForgeSwapRecipeForCard(card: UserCard): ForgeSwapRecipe {
  const r = normalizeRarityName(card.rarity_name);
  if (r === "common") {
    return { slots: 1, requireDuplicateCardId: false };
  }
  if (r === "rare") {
    return { slots: 2, requireDuplicateCardId: true };
  }
  return { slots: 1, requireDuplicateCardId: false };
}

export function forgeSwapCanSubmit(
  recipe: ForgeSwapRecipe,
  slots: (UserCard | null)[]
): boolean {
  const filled = slots.filter(Boolean) as UserCard[];
  if (recipe.slots === 1) {
    return filled.length === 1;
  }
  if (filled.length !== 2) return false;
  const [a, b] = filled;
  if (a.user_card_id === b.user_card_id) return false;
  if (recipe.requireDuplicateCardId && a.card_id !== b.card_id) return false;
  return true;
}
