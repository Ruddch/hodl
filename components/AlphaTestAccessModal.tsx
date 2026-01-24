"use client";

interface AlphaTestAccessModalProps {
  onClose: () => void;
}

export function AlphaTestAccessModal({ onClose }: AlphaTestAccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-black">
                Alpha Test Access
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-base text-zinc-700 mb-6">
            Sorry, your wallet does not have access to the alpha test.
          </p>
          <p className="text-base text-zinc-700 mb-6">
            See you in the beta!
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#2200EF] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
