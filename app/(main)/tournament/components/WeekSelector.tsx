import type { Tournament } from "@/lib/types";

interface WeekSelectorProps {
  tournaments: Tournament[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function WeekSelector({ tournaments, selectedId, onSelect }: WeekSelectorProps) {
  return (
    <div className="flex items-center gap-3 md:gap-9">
      {tournaments.map((t, index) => {
        const isSelected = selectedId === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`cursor-pointer text-base font-medium leading-none tracking-normal transition-colors ${
              isSelected
                ? "text-black"
                : "text-black/50 hover:text-black/70"
            }`}
          >
            Week {tournaments.length - index}
          </button>
        );
      })}
    </div>
  );
}
