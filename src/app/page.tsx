import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineZigzag } from "@/components/TimelineZigzag";
import { CommentWall } from "@/components/CommentWall";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitTracker } from "@/components/VisitTracker";

export default async function HomePage() {
  const matches = await listMatches();

  return (
    <>
      {/* 静默记录访问 */}
      <VisitTracker />

      <HeroIntro totalMatches={matches.length} />
      <TimelineZigzag matches={matches} />
      <CommentWall />
      <SiteFooter matches={matches} />
    </>
  );
}
