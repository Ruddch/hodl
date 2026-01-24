/**
 * Генерация детерминированной аватарки на основе адреса кошелька
 * Одинаковый адрес всегда дает одинаковую аватарку
 * Разные адреса дают разные аватарки
 */

// Палитра цветов для градиентов (в формате HSL для лучшего контроля)
const COLOR_PALETTE = [
  // Зеленые оттенки
  { h: 120, s: 70, l: 60 }, // Лаймово-зеленый
  { h: 150, s: 65, l: 55 }, // Мятно-зеленый
  { h: 180, s: 60, l: 50 }, // Бирюзовый
  
  // Фиолетовые/лавандовые оттенки
  { h: 270, s: 65, l: 65 }, // Лавандовый
  { h: 280, s: 70, l: 60 }, // Фиолетовый
  { h: 300, s: 60, l: 65 }, // Розово-фиолетовый
  
  // Голубые оттенки
  { h: 200, s: 70, l: 60 }, // Светло-голубой
  { h: 210, s: 65, l: 55 }, // Голубой
  { h: 190, s: 60, l: 65 }, // Небесно-голубой
  
  // Оранжевые/теплые оттенки
  { h: 30, s: 80, l: 60 },  // Оранжевый
  { h: 40, s: 75, l: 65 },  // Персиковый
  { h: 20, s: 70, l: 55 },  // Темно-оранжевый
  
  // Розовые оттенки
  { h: 330, s: 70, l: 65 }, // Розовый
  { h: 340, s: 65, l: 60 }, // Розово-красный
  { h: 320, s: 75, l: 70 }, // Светло-розовый
];

// Стили градиентов
const GRADIENT_STYLES = [
  'radial', // Радиальный градиент с бликом
  'linear-diagonal', // Линейный диагональный
  'linear-horizontal', // Линейный горизонтальный
  'block', // Блочный стиль (два цвета)
];

/**
 * Генерирует хеш из строки (простая детерминированная функция)
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Генерирует детерминированные значения на основе адреса
 */
function generateSeedValues(walletAddress: string) {
  const hash = simpleHash(walletAddress.toLowerCase());
  
  // Выбираем цвета из палитры
  const color1Index = hash % COLOR_PALETTE.length;
  const color2Index = ((hash >> 8) % COLOR_PALETTE.length);
  const color3Index = ((hash >> 16) % COLOR_PALETTE.length);
  
  // Выбираем стиль градиента
  const gradientStyleIndex = ((hash >> 24) % GRADIENT_STYLES.length);
  
  // Позиция блика (для радиального градиента)
  const highlightX = 60 + ((hash >> 4) % 20); // 60-80%
  const highlightY = 20 + ((hash >> 12) % 20); // 20-40%
  
  // Интенсивность блика
  const highlightIntensity = 0.3 + ((hash >> 20) % 20) / 100; // 0.3-0.5
  
  return {
    color1: COLOR_PALETTE[color1Index],
    color2: COLOR_PALETTE[color2Index],
    color3: COLOR_PALETTE[color3Index],
    gradientStyle: GRADIENT_STYLES[gradientStyleIndex],
    highlightX,
    highlightY,
    highlightIntensity,
  };
}

/**
 * Конвертирует HSL в RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return [r, g, b];
}

/**
 * Конвертирует RGB в hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

export interface AvatarStyle {
  background: string;
  className?: string;
}

/**
 * Генерирует стиль аватарки на основе адреса кошелька
 * @param walletAddress - Адрес кошелька (может быть null/undefined)
 * @param fallbackSeed - Запасной seed для случая, когда адрес отсутствует
 * @returns Объект со стилями для аватарки
 */
export function generateAvatarStyle(
  walletAddress: string | null | undefined,
  fallbackSeed?: string | number
): AvatarStyle {
  // Если адрес отсутствует, используем fallback
  const seed = walletAddress || (fallbackSeed ? String(fallbackSeed) : 'default');
  const values = generateSeedValues(seed);
  
  const [r1, g1, b1] = hslToRgb(values.color1.h, values.color1.s, values.color1.l);
  const [r2, g2, b2] = hslToRgb(values.color2.h, values.color2.s, values.color2.l);
  const [r3, g3, b3] = hslToRgb(values.color3.h, values.color3.s, values.color3.l);
  
  const color1Hex = rgbToHex(r1, g1, b1);
  const color2Hex = rgbToHex(r2, g2, b2);
  const color3Hex = rgbToHex(r3, g3, b3);
  
  // Генерируем более светлый цвет для блика
  const [hr1, hg1, hb1] = hslToRgb(values.color1.h, values.color1.s, Math.min(100, values.color1.l + 20));
  const highlightColor = rgbToHex(hr1, hg1, hb1);
  
  let background = '';
  
  switch (values.gradientStyle) {
    case 'radial': {
      // Радиальный градиент с бликом
      background = `radial-gradient(circle at ${values.highlightX}% ${values.highlightY}%, ${highlightColor} ${values.highlightIntensity * 100}%, ${color1Hex} 0%, ${color2Hex} 50%, ${color3Hex} 100%)`;
      break;
    }
    case 'linear-diagonal': {
      // Диагональный градиент
      background = `linear-gradient(135deg, ${color1Hex} 0%, ${color2Hex} 50%, ${color3Hex} 100%)`;
      break;
    }
    case 'linear-horizontal': {
      // Горизонтальный градиент
      background = `linear-gradient(90deg, ${color1Hex} 0%, ${color2Hex} 50%, ${color3Hex} 100%)`;
      break;
    }
    case 'block': {
      // Блочный стиль (два цвета)
      const blockAngle = 45 + ((simpleHash(seed) >> 16) % 90);
      background = `linear-gradient(${blockAngle}deg, ${color1Hex} 0%, ${color1Hex} 60%, ${color2Hex} 60%, ${color2Hex} 100%)`;
      break;
    }
  }
  
  return {
    background,
  };
}
