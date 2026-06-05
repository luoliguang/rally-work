import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineZigzag } from "@/components/TimelineZigzag";
import { SiteFooter } from "@/components/SiteFooter";

export default async function HomePage() {
  const matches = await listMatches();

  return (
    <>
      <HeroIntro totalMatches={matches.length} />
      <TimelineZigzag matches={matches} />
      <SiteFooter matches={matches} />
    </>
  );
}
