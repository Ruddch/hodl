export function StatusBadge({ status }: { status: string }) {
  if (status === "registration") {
    return (
      <span className="px-3 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[#BAFFD9] text-black">
        OPENED
      </span>
    );
  }
  if (status === "ongoing") {
    return (
      <span className="px-3 py-1  leading-[16px] text-[10px] font-semibold rounded bg-[#BAFFD9] text-black">
        LIVE
      </span>
    );
  }
  return (
    <span className="px-3 py-1 leading-[16px] text-[10px] font-semibold rounded bg-zinc-200 text-zinc-600">
      FINISHED
    </span>
  );
}
