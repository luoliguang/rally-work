import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineZigzag } from "@/components/TimelineZigzag";
import { CommentWall } from "@/components/CommentWall";
import { SiteFooter } from "@/components/SiteFooter";
import { VisitTracker } from "@/components/VisitTracker";

// 每次请求都读取最新的 matches.json（而非构建时烤进 HTML）。
// 这样后台新增/修改记录、上传图片后，前端立刻生效，无需重新 build。
export const dynamic = "force-dynamic";

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
