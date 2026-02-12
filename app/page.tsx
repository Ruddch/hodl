"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REF_CODE_KEY } from "@/components/RefCapture";

function HomeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && typeof window !== "undefined") {
      localStorage.setItem(REF_CODE_KEY, ref);
    }
    router.push("/tournament");
  }, [router, searchParams]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}
