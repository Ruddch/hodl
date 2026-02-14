export function StatusBadge({ status }: { status: string }) {
  if (status === "registration") {
    return (
      <span className="px-3 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[var(--badge-opened)] text-[var(--badge-opened-text)]">
        OPENED
      </span>
    );
  }
  if (status === "ongoing") {
    return (
      <span className="px-3 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[var(--badge-opened)] text-[var(--badge-opened-text)]">
        LIVE
      </span>
    );
  }
  return (
    <span className="px-3 py-1 leading-[16px] text-[10px] font-semibold rounded bg-[var(--surface-elevated)] text-[var(--text-muted)]">
      FINISHED
    </span>
  );
}
