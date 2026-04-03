import { BASE_PATH } from "@/lib/constants";

/** «Стандартный» тип пака: магазин / нижняя часть анимации открытия (pack-bottom-3). */
export const STANDARD_PACK_TYPE_ID = 6;

function publicAssetPath(filename: string): string {
  const base = BASE_PATH ? `${BASE_PATH}/` : "";
  return base ? `${base}${filename}` : `/${filename}`;
}

/** CSS `background-image` для `.parallax-effect` при открытии пака */
export function packOpeningParallaxBottomBackground(packTypeId?: number): string {
  const filename =
    packTypeId === undefined || packTypeId === STANDARD_PACK_TYPE_ID
      ? "pack-bottom-3.png"
      : "pack-bottom-5.png";
  const path = publicAssetPath(filename);
  return `url('${path}')`;
}
