import { listMatches } from "@/lib/matches";
import { HeroIntro } from "@/components/HeroIntro";
import { TimelineZigzag } from "@/components/TimelineZigzag";

export default async function HomePage() {
  const matches = await listMatches();

  return (
    <>
      <HeroIntro totalMatches={matches.length} />
      <TimelineZigzag matches={matches} />

      <footer
        className="flex items-center justify-center py-16 text-xs tracking-widest uppercase"
        style={{ color: "var(--muted)" }}
      >
        Rally &nbsp;·&nbsp; 记录关于我们在工厂时的羽毛球时光
      </footer>
    </>
  );
}
