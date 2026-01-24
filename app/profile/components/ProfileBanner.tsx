"use client";

interface ProfileBannerProps {
  onLogout: () => void;
}

export function ProfileBanner({ onLogout }: ProfileBannerProps) {
  return (
    <div className="relative m-0 rounded-[16px] overflow-hidden">
      {/* Баннер с изображением */}
      <div 
        className="h-48 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/profile_banner.png')"
        }}
      >
        {/* Кнопка выхода */}
        <button
          onClick={onLogout}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Logout"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6"
              stroke="white"
              strokeOpacity="0.8"
              strokeWidth="1.33333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
