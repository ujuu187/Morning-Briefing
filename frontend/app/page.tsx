import Link from "next/link";
import { fetchBriefing, fetchIndicators, SECTION_LABELS, Article, Indicator } from "@/lib/api";

function ImportanceBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    high: { bg: "#3b0707", color: "var(--high)", label: "HIGH" },
    mid:  { bg: "#3b2800", color: "var(--mid)", label: "MID" },
    low:  { bg: "#1a2530", color: "var(--low)", label: "LOW" },
  };
  const s = styles[level] || styles.low;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function IndicatorChip({ ind }: { ind: Indicator }) {
  const isUp = (ind.change_pct ?? 0) > 0;
  const isDn = (ind.change_pct ?? 0) < 0;
  const color = isUp ? "var(--up)" : isDn ? "var(--dn)" : "var(--text-muted)";
  const arrow = isUp ? "▲" : isDn ? "▼" : "—";
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}>
      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{ind.name}</div>
      <div className="font-mono font-bold text-sm" style={{ color: "var(--text)" }}>
        {ind.unit}{ind.value?.toLocaleString()}
      </div>
      {ind.change_pct !== null && (
        <div className="text-xs font-mono mt-0.5" style={{ color }}>
          {arrow} {ind.change_pct > 0 ? "+" : ""}{ind.change_pct?.toFixed(2)}%
        </div>
      )}
    </div>
  );
}

async function HomeContent() {
  const [briefingResult, indicatorsResult] = await Promise.allSettled([
    fetchBriefing(),
    fetchIndicators(),
  ]);

  const briefing = briefingResult.status === "fulfilled" ? briefingResult.value : null;
  const indicators = indicatorsResult.status === "fulfilled" ? indicatorsResult.value : null;

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const allArticles: (Article & { section: string })[] = [];
  if (briefing) {
    for (const [sec, arts] of Object.entries(briefing.sections)) {
      for (const a of arts) allArticles.push({ ...a, section: sec });
    }
  }
  const highArticles = allArticles.filter((a) => a.importance === "high").slice(0, 5);

  const topIndicators: Indicator[] = [];
  if (indicators) {
    for (const group of Object.values(indicators.groups)) {
      topIndicators.push(...group.slice(0, 2));
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{today}</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--accent-bright)" }}>
          Morning Briefing
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          AI Foundation · Responsible AI · Startup · Payment · Fintech
        </p>
        {briefing ? (
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span style={{ color: "var(--accent)" }}>✓ {allArticles.length}건 오늘의 브리핑 준비됨</span>
            <span style={{ color: "var(--text-muted)" }}>기준일: {briefing.date}</span>
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "#1a1a0a", border: "1px solid #3d3800", color: "#ffd54f" }}>
            ⚠️ 백엔드 서버에 연결할 수 없습니다.{" "}
            <code className="text-xs bg-black/30 px-1 py-0.5 rounded">uvicorn api:app --reload</code>를 실행해주세요.
          </div>
        )}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { href: "/newsfeed", label: "뉴스피드", desc: `${allArticles.length}건`, icon: "📰" },
          { href: "/indicators", label: "경제지표", desc: `${topIndicators.length}개 지표`, icon: "📊" },
          {
            href: "/newsfeed",
            label: "섹션 필터",
            desc: `${Object.keys(briefing?.sections ?? {}).length}개 섹션`,
            icon: "🔍",
          },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-xl p-5 flex flex-col gap-1 transition-opacity hover:opacity-80"
            style={{ background: "var(--bg-card2)", border: "1px solid var(--border)" }}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold" style={{ color: "var(--accent-bright)" }}>{item.label}</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</span>
          </Link>
        ))}
      </div>

      {/* High-importance articles */}
      {highArticles.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <span style={{ color: "var(--high)" }}>◆</span> 오늘의 핵심 기사
          </h2>
          <div className="space-y-3">
            {highArticles.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl p-4 transition-opacity hover:opacity-80"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <ImportanceBadge level={a.importance} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {SECTION_LABELS[a.section] ?? a.section} · {a.source}
                      </span>
                    </div>
                    <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>
                      {a.title}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {a.summary}
                    </p>
                  </div>
                  <span className="text-xs shrink-0 mt-1" style={{ color: "var(--accent)" }}>↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Indicators snapshot */}
      {topIndicators.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <span style={{ color: "var(--accent)" }}>◆</span> 주요 지표 스냅샷
            </h2>
            <Link href="/indicators" className="text-xs" style={{ color: "var(--accent)" }}>
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {topIndicators.slice(0, 12).map((ind) => (
              <IndicatorChip key={ind.key} ind={ind} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function HomePage() {
  return <HomeContent />;
}
