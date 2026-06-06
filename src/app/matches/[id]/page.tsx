import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch } from "@/lib/matches";
import { ScoreBadge } from "@/components/ScoreBadge";
import { MediaItem } from "@/components/MediaItem";

// 每次请求读最新数据（从数据库），新增的比赛也能即时访问详情页。
// 不预生成静态页，避免构建时依赖数据库连接。
export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/timeline" className="text-sm text-slate-400 hover:text-slate-200">
        ← 返回时间线
      </Link>

      <header className="mt-6 mb-6">
        <ScoreBadge match={match} size="lg" />
        <p className="mt-3 text-sm text-slate-400">
          {match.date}
          {match.weekday ? ` · ${match.weekday}` : ""} · vs {match.opponent} · 当天 {match.gamesPlayed} 场胜 {match.gamesWon}
        </p>
        {match.players?.length ? (
          <p className="mt-1 text-sm text-slate-500">
            出场:{match.players.join("、")}
            {match.mvp ? ` · MVP:${match.mvp}` : ""}
          </p>
        ) : null}
      </header>

      <p className="whitespace-pre-wrap text-slate-200">{match.caption}</p>

      {match.media.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {match.media.map((media, i) => (
            <MediaItem key={`${match.id}-${i}`} media={media} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
