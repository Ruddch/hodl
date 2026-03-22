"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { setAcquisitionFromSearchString } from "@/lib/acquisition";

function AcquisitionCaptureInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    if (q) setAcquisitionFromSearchString(q);
  }, [searchParams]);

  return null;
}

export function AcquisitionCapture() {
  return (
    <Suspense fallback={null}>
      <AcquisitionCaptureInner />
    </Suspense>
  );
}
