"use client";

import { useState, useRef, useEffect } from "react";

interface EpochSelectorProps {
  epochs: string[];
  selectedEpoch: string;
  onSelect: (epoch: string) => void;
  className?: string;
}

export function EpochSelector({ epochs, selectedEpoch, onSelect, className }: EpochSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (epoch: string) => {
    onSelect(epoch);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`appearance-none bg-[var(--surface)] border border-[var(--border)] rounded-[15px] px-4 py-3 text-base font-medium text-[var(--text-primary)] leading-none tracking-normal cursor-pointer focus:outline-none min-w-[198px] h-12 flex items-center justify-between w-full transition-all hover:ring-2 hover:ring-purple-400/20 ${
          isOpen
            ? "ring-2 ring-purple-400/30 shadow-[0px_7px_2px_0px_rgba(133,109,253,0),0px_5px_2px_0px_rgba(133,109,253,0.01),0px_3px_2px_0px_rgba(133,109,253,0.05),0px_1px_1px_0px_rgba(133,109,253,0.09),0px_0px_1px_0px_rgba(133,109,253,0.1),0_0_0_2px_rgba(168,85,247,0.2)]"
            : "shadow-[0px_7px_2px_0px_rgba(133,109,253,0),0px_5px_2px_0px_rgba(133,109,253,0.01),0px_3px_2px_0px_rgba(133,109,253,0.05),0px_1px_1px_0px_rgba(133,109,253,0.09),0px_0px_1px_0px_rgba(133,109,253,0.1)]"
        }`}
      >
        <span>{selectedEpoch.charAt(0).toUpperCase() + selectedEpoch.slice(1)}</span>
        <svg
          className={`w-4 h-4 text-[var(--text-primary)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-[15px] shadow-lg z-[70] overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {epochs.map((epoch) => (
              <button
                key={epoch}
                type="button"
                onClick={() => handleSelect(epoch)}
                className={`w-full text-left px-4 py-3 text-base font-medium text-[var(--text-primary)] leading-none tracking-normal transition-colors ${
                  selectedEpoch === epoch ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-hover)]"
                }`}
              >
                {epoch.charAt(0).toUpperCase() + epoch.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
