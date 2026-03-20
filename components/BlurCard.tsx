import { ReactNode } from "react";

/** Горизонтальное положение цветного слоя (размер слоя задаётся `bgLayerWidthPercent` / `bgLayerHeightPercent`). */
export type BlurCardBgLayerAlignX = "left" | "center" | "right";

/** Вертикальное положение цветного слоя. */
export type BlurCardBgLayerAlignY = "top" | "center" | "bottom";

const DEFAULT_BG_LAYER_W = 50;
const DEFAULT_BG_LAYER_H = 50;

function bgLayerLeftPct(align: BlurCardBgLayerAlignX, widthPct: number): number {
  switch (align) {
    case "left":
      return 0;
    case "right":
      return 100 - widthPct;
    case "center":
    default:
      return (100 - widthPct) / 2;
  }
}

function bgLayerTopPct(align: BlurCardBgLayerAlignY, heightPct: number): number {
  switch (align) {
    case "top":
      return 0;
    case "bottom":
      return 100 - heightPct;
    case "center":
    default:
      return (100 - heightPct) / 2;
  }
}

interface BlurCardProps {
  children: ReactNode;
  /**
   * Background color with opacity for the blur effect
   * Default: rgba(210, 247, 243, 0.8)
   */
  backgroundColor?: string;
  /**
   * Border radius in pixels
   * Default: 30px
   */
  borderRadius?: number;
  /**
   * Background blur value in pixels
   * Default: 81.1px
   */
  blurValue?: number;
  /**
   * Горизонтальное выравнивание прямоугольника цветного слоя внутри карточки.
   * @default "center"
   */
  bgLayerAlignX?: BlurCardBgLayerAlignX;
  /**
   * Вертикальное выравнивание прямоугольника цветного слоя.
   * @default "center"
   */
  bgLayerAlignY?: BlurCardBgLayerAlignY;
  /**
   * Ширина цветного слоя в процентах от карточки.
   * @default 50
   */
  bgLayerWidthPercent?: number;
  /**
   * Высота цветного слоя в процентах от карточки.
   * @default 50
   */
  bgLayerHeightPercent?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function BlurCard({
  children,
  backgroundColor = "rgba(210, 247, 243, 0.8)",
  borderRadius = 30,
  blurValue = 81.1,
  bgLayerAlignX = "center",
  bgLayerAlignY = "center",
  bgLayerWidthPercent = DEFAULT_BG_LAYER_W,
  bgLayerHeightPercent = DEFAULT_BG_LAYER_H,
  className = "",
}: BlurCardProps) {
  const isFlex = className.includes('flex');
  const isFlexCol = className.includes('flex-col');

  const bgLeft = bgLayerLeftPct(bgLayerAlignX, bgLayerWidthPercent);
  const bgTop = bgLayerTopPct(bgLayerAlignY, bgLayerHeightPercent);
  
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        background: "var(--blurcard-gradient)",
        boxShadow: "var(--blurcard-shadow)",
      }}
    >
      {/* Inner container with border radius */}
      <div
        className={`relative w-full h-full overflow-hidden ${isFlex ? 'flex' : ''} ${isFlexCol ? 'flex-col' : ''}`}
        style={{
          borderRadius: `${borderRadius - 1}px`,
        }}
      >
        {/* Background color rectangle layer */}
        <div
          className="absolute"
          style={{
            width: `${bgLayerWidthPercent}%`,
            height: `${bgLayerHeightPercent}%`,
            left: `${bgLeft}%`,
            top: `${bgTop}%`,
            background: backgroundColor,
            opacity: "var(--blurcard-bg-layer-opacity)",
          }}
        />
        
        {/* Blur layer on top of background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "var(--blurcard-overlay)",
            backdropFilter: `blur(${blurValue}px)`,
            WebkitBackdropFilter: `blur(${blurValue}px)`,
          }}
        />
        
        {/* Content layer */}
        <div className={`relative h-full ${isFlex ? 'flex' : ''} ${isFlexCol ? 'flex-col' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
