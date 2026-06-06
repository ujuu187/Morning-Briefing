import { fetchBriefing, Article } from "@/lib/api";
import RealEstateSubNav from "@/components/RealEstateSubNav";

function ImportanceBadge({ level }: { level: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    high: { bg: "#3b0707", color: "var(--high)" },
    mid:  { bg: "#3b2800", color: "var(--mid)" },
    low:  { bg: "#1a2530", color: "var(--low)" },
  };
  const s = map[level] || map.low;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {level.toUpperCase()}
    </span>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <ImportanceBadge level={article.importance} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{article.source}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold leading-snug hover:underline"
            style={{ color: "var(--text)" }}
          >
            {article.title}
          </a>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs px-2 py-1 rounded"
          style={{ background: "var(--bg-card2)", color: "var(--accent)", border: "1px solid var(--border)" }}
        >
          ↗ 원문
        </a>
      </div>
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{article.summary}</p>
      <ul className="space-y-1.5 mb-3">
        {article.bullets.map((b, i) => (
          <li key={i} className="text-xs flex gap-2" style={{ color: b.startsWith("→") ? "var(--accent-bright)" : "var(--text-muted)" }}>
            <span className="shrink-0" style={{ color: "var(--accent)" }}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5">
        {article.keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-card2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function RealEstatePage() {
  let articles: Article[] = [];
  let date = "";

  try {
    const briefing = await fetchBriefing();
    articles = briefing.sections["real-estate-kr"] ?? [];
    date = briefing.date;
  } catch {}

  return (
    <div>
      <RealEstateSubNav />
      {articles.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--text-muted)" }}>부동산 뉴스 데이터가 없습니다</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--bg-card2)", color: "var(--accent)" }}>
              python collector.py
            </code>
            를 먼저 실행해주세요.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>기준일: {date} · {articles.length}건</p>
          <div className="space-y-4">
            {articles.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
