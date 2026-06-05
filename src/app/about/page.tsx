import Link from "next/link";

// About: team intro / avatar wall / slogan. Placeholder for the MVP (README §6 ④).
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
        ← 返回首页
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-white">关于我们</h1>
      <p className="mt-3 text-slate-400">
        球场上没有常胜将军,只有永不言弃的我们。(队伍简介、头像墙、口号 —— 待补充。)
      </p>
    </main>
  );
}
