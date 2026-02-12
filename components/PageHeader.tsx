"use client";

import { Logo } from "./Logo";

interface PageHeaderProps {
  title?: string;
  isSidebarOpen?: boolean;
}

export function PageHeader({ title, isSidebarOpen }: PageHeaderProps) {
  const displayText = isSidebarOpen ? "Hodleague" : (title ?? "");

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <Logo />
      <span className="text-xl font-medium text-black truncate">
        {displayText}
      </span>
    </div>
  );
}
