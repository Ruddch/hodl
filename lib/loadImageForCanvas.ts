export type LoadImageForCanvasOptions = {
  /**
   * Cache-bust: всегда добавляем `t=…` к URL. Если не передать — новый `Date.now()` на каждый вызов.
   * Для forge: один и тот же `bust` при предзагрузке и WebGL → один URL → попадание в HTTP-кэш.
   */
  bust?: string | number;
};

/**
 * Загрузка изображения для canvas / WebGL — crossOrigin anonymous (нужен для texImage2D / getImageData).
 * К URL всегда добавляется параметр `t` (cache-bust).
 */
export function loadImageForCanvas(src: string, options?: LoadImageForCanvasOptions): Promise<HTMLImageElement> {
  const bust = options?.bust ?? Date.now();
  const sep = src.includes("?") ? "&" : "?";
  const url = `${src}${sep}t=${bust}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
