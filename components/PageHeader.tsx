"use client";

import { Logo } from "./Logo";

interface PageHeaderProps {
  title?: string;
  isSidebarOpen?: boolean;
  onClick?: () => void;
}

export function PageHeader({ title, isSidebarOpen, onClick }: PageHeaderProps) {
  const displayText = isSidebarOpen ? "Hodleague" : (title ?? "");

  return (
    <div onClick={onClick ? () => onClick() : () => {} } className="flex items-center gap-2 min-w-0 flex-1">
      <Logo />
      <span className="text-xl font-medium text-[var(--text-primary)] truncate">
        {displayText}
      </span>
    </div>
  );
}
