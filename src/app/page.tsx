import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineScroll } from "@/components/TimelineScroll";

// Single-page scrolling timeline. The whole site lives here.
// No stats dashboard, no navigation — just memories, top to bottom.
export default async function HomePage() {
  const matches = await listMatches();

  return (
    <main className="mx-auto max-w-xl px-6">
      <HeroIntro totalMatches={matches.length} />
      <TimelineScroll matches={matches} />
    </main>
  );
}
