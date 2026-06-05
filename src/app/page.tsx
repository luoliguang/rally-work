import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineHorizontal } from "@/components/TimelineHorizontal";

export default async function HomePage() {
  const matches = await listMatches();

  return (
    <>
      <HeroIntro totalMatches={matches.length} />
      <TimelineHorizontal matches={matches} />

      <footer
        className="flex items-center justify-center py-16 text-xs tracking-widest uppercase"
        style={{ color: "var(--muted)" }}
      >
        Rally &nbsp;·&nbsp; 记录每一次上场
      </footer>
    </>
  );
}
