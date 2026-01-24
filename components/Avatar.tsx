"use client";

import { generateAvatarStyle } from "@/lib/avatar";

interface AvatarProps {
  walletAddress?: string | null;
  fallbackSeed?: string | number;
  size?: number | string;
  className?: string;
  border?: boolean;
  borderColor?: string;
}

/**
 * Универсальный компонент аватарки, генерируемый на основе адреса кошелька
 * Одинаковый адрес всегда дает одинаковую аватарку
 */
export function Avatar({
  walletAddress,
  fallbackSeed,
  size = 40,
  className = "",
  border = false,
  borderColor = "white",
}: AvatarProps) {
  const style = generateAvatarStyle(walletAddress, fallbackSeed);
  
  const sizeValue = typeof size === "number" ? `${size}px` : size;
  
  return (
    <div
      className={`rounded-full ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        background: style.background,
        border: border ? `4px solid ${borderColor}` : undefined,
        flexShrink: 0,
      }}
    />
  );
}
