"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const REF_CODE_KEY = "hodleague_ref_code";

function RefCaptureInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && typeof window !== "undefined") {
      localStorage.setItem(REF_CODE_KEY, ref);
    }
  }, [searchParams]);

  return null;
}

export function RefCapture() {
  return (
    <Suspense fallback={null}>
      <RefCaptureInner />
    </Suspense>
  );
}

export { REF_CODE_KEY };
