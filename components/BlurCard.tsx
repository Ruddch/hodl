import { ReactNode } from "react";

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
   * Additional CSS classes
   */
  className?: string;
}

export function BlurCard({
  children,
  backgroundColor = "rgba(210, 247, 243, 0.8)",
  borderRadius = 30,
  blurValue = 81.1,
  className = "",
}: BlurCardProps) {
  const isFlex = className.includes('flex');
  const isFlexCol = className.includes('flex-col');
  
  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.53) 0%, rgba(255, 255, 255, 0) 100%)",
        boxShadow: "1px 10px 22px 0px rgba(214, 214, 214, 0.1)",
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
          className="absolute w-[50%] h-[50%] top-[25%] left-[25%] right-0 bottom-0 inset-0"
          style={{
            background: backgroundColor,
          }}
        />
        
        {/* Blur layer on top of background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(161, 161, 161, 0.07)",
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
