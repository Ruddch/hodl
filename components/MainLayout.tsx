"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-dvh bg-white">
      {/* Мобильная навигационная панель в стиле сайдбара */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 py-4 touch-none select-none ${isSidebarOpen ? "bg-[#f6f6f6]" : "bg-transparent"} backdrop-blur-[75px] rounded-br-[30px]`}>
        <PageHeader onClick={toggleSidebar} title={title} isSidebarOpen={isSidebarOpen} />
        <button
          onClick={toggleSidebar}
          className="relative p-2 -m-2 hover:bg-[#e6e6e6] rounded-lg transition-colors w-10 h-10 flex items-center justify-center"
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          {/* Бургер — плавный переход в крестик */}
          <svg
            className={`absolute w-6 h-6 text-black transition-all duration-300 ${
              isSidebarOpen ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <svg
            className={`absolute w-6 h-6 text-black transition-all duration-300 ${
              isSidebarOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Overlay для мобильных */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 touch-none select-none transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Основной контент */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-white pt-16 py-5 px-4 md:py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

