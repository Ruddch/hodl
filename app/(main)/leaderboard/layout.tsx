import { LeaderboardModeTabs } from "@/components/LeaderboardModeTabs";

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-8xl mx-auto flex flex-col min-w-0 h-full">
      <LeaderboardModeTabs className="mb-4 md:mb-5 shrink-0" />
      {children}
    </div>
  );
}
