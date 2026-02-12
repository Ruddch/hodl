"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Кнопка гамбургера для мобильных */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed top-4.5 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-[#e6e6e6] transition-colors"
        aria-label="Open menu"
      >
        <svg
          className="w-6 h-6 text-black"
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
      </button>

      {/* Overlay для мобильных */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Основной контент */}
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto py-5 px-4 md:py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

