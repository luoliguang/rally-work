import Link from "next/link";
import { listMatches } from "@/lib/matches";
import { MatchCard } from "@/components/MatchCard";

// 每次请求读最新数据，后台改动即时生效
export const dynamic = "force-dynamic";

// Timeline: every match, newest first. Keep this data area light — thumbnails
// only, no heavy media. Add "load more" pagination when the list grows (README §6/§8).
export default async function TimelinePage() {
  const matches = await listMatches();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <header className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-white">时间线</h1>
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
          ← 返回首页
        </Link>
      </header>

      {matches.length === 0 ? (
        <p className="text-slate-400">还没有记录。</p>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </main>
  );
}
