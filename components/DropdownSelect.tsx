"use client";

import { useState, useRef, useEffect } from "react";

export interface DropdownSelectOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  options: DropdownSelectOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  minWidth?: string;
}

export function DropdownSelect({
  options,
  value,
  onSelect,
  placeholder,
  className = "",
  minWidth = "198px",
}: DropdownSelectProps) {
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

  const handleSelect = (v: string) => {
    onSelect(v);
    setIsOpen(false);
  };

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? value;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`appearance-none bg-[var(--surface)] border border-[var(--border)] rounded-[15px] px-4 py-3 text-base font-medium text-[var(--text-primary)] leading-none tracking-normal cursor-pointer focus:outline-none h-12 flex items-center justify-between w-full transition-all hover:ring-2 hover:ring-purple-400/20 ${
          isOpen
            ? "ring-2 ring-purple-400/30 shadow-[0px_7px_2px_0px_rgba(133,109,253,0),0px_5px_2px_0px_rgba(133,109,253,0.01),0px_3px_2px_0px_rgba(133,109,253,0.05),0px_1px_1px_0px_rgba(133,109,253,0.09),0px_0px_1px_0px_rgba(133,109,253,0.1),0_0_0_2px_rgba(168,85,247,0.2)]"
            : "shadow-[0px_7px_2px_0px_rgba(133,109,253,0),0px_5px_2px_0px_rgba(133,109,253,0.01),0px_3px_2px_0px_rgba(133,109,253,0.05),0px_1px_1px_0px_rgba(133,109,253,0.09),0px_0px_1px_0px_rgba(133,109,253,0.1)]"
        }`}
        style={{ minWidth }}
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-4 h-4 text-[var(--text-primary)] transition-transform shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-full bg-[var(--surface)] border border-[var(--border)] rounded-[15px] shadow-lg z-[70] overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-3 text-base font-medium text-[var(--text-primary)] leading-none tracking-normal transition-colors ${
                  value === opt.value ? "bg-[var(--surface-hover)]" : "hover:bg-[var(--surface-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
