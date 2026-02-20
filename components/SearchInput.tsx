"use client";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** "default" — с иконкой, крупнее; "compact" — компактный вариант (модалки) */
  variant?: "default" | "compact";
  /** Показывать иконку лупы. Для compact по умолчанию false */
  showIcon?: boolean;
  className?: string;
}

const SearchIcon = () => (
  <svg
    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-placeholder)] pointer-events-none"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export function SearchInput({
  value,
  onChange,
  placeholder,
  variant = "default",
  showIcon = variant === "default",
  className,
}: SearchInputProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`relative ${className ?? ""}`}>
      {showIcon && <SearchIcon />}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] placeholder:text-[var(--text-placeholder)] outline-none focus:outline-none ${showIcon ? "pl-11 pr-4" : "px-3 sm:px-4"} ${isCompact ? "py-2 sm:py-2.5 rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-50" : "h-11 md:h-12 rounded-2xl text-base"}`}
      />
    </div>
  );
}
