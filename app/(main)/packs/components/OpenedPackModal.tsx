"use client";

import type { ConfirmOpenPackResponse } from "@/lib/types";
import { PackOpeningAnimation } from "./PackOpeningAnimation";

interface OpenedPackModalProps {
  result: ConfirmOpenPackResponse;
  onClose: () => void;
}

export function OpenedPackModal({ result, onClose }: OpenedPackModalProps) {
  return (
    <div className="fixed inset-0 bg-[#121111] z-[70]">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors z-10"
        aria-label="Close"
        data-ph-capture-attribute-button="opened-pack-modal-close"
      >
        <svg
          className="w-6 h-6"
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

      {/* Pack Opening Animation */}
      <PackOpeningAnimation
        packTypeId={result.pack_type_id}
        cards={result.cards_received}
      />
    </div>
  );
}
