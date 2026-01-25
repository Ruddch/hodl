"use client";

import { generateAvatarStyle } from "@/lib/avatar";

interface AvatarProps {
  walletAddress?: string | null;
  fallbackSeed?: string | number;
  size?: number | string;
  className?: string;
  border?: boolean;
  borderColor?: string;
  avatarUrl?: string | null;
}

/**
 * Универсальный компонент аватарки
 * Если передан avatarUrl, показывает его, иначе генерирует на основе адреса кошелька
 * Одинаковый адрес всегда дает одинаковую аватарку
 */
export function Avatar({
  walletAddress,
  fallbackSeed,
  size = 40,
  className = "",
  border = false,
  borderColor = "white",
  avatarUrl,
}: AvatarProps) {
  const style = generateAvatarStyle(walletAddress, fallbackSeed);
  
  const sizeValue = typeof size === "number" ? `${size}px` : size;
  
  // Если есть avatarUrl, показываем изображение
  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden ${className}`}
        style={{
          width: sizeValue,
          height: sizeValue,
          border: border ? `4px solid ${borderColor}` : undefined,
          flexShrink: 0,
        }}
      >
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Если изображение не загрузилось, скрываем его и показываем fallback
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.background = style.background;
            }
          }}
        />
      </div>
    );
  }
  
  // Иначе показываем сгенерированную аватарку
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
